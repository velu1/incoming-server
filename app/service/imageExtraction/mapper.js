const DEFAULT_PLACEHOLDERS = {
  partNumber:      { value: "PART NO" },
  quantity:        { value: "QTY" },
  lotNumber:       { value: "LOT NO" },
  manufactureDate: { value: "DATE" },
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build a flexible OCR pattern for a label: tolerates spaces between chars (OCR artifacts)
// and accepts any non-alphanumeric separator (colon, dash, space, slash, etc.)
function buildLabelRegex(label) {
  const words = label.trim().split(/\s+/);
  const wordPatterns = words.map(word =>
    escapeRegex(word).split("").join("[\\s]*")
  );
  return wordPatterns.join("[\\s]+");
}

function buildAlphaPattern(label) {
  const lp = buildLabelRegex(label);
  return new RegExp(`${lp}[^A-Z0-9]+([A-Z0-9][A-Z0-9\\-_./]*)`, "i");
}

function buildNumericPattern(label) {
  const lp = buildLabelRegex(label);
  return new RegExp(`${lp}[^\\d]*(\\d+)`, "i");
}

// Try to identify what field a barcode value belongs to
function matchBarcodeToField(value, partNumbers) {
  const v = value.trim();

  // Pure number → likely quantity
  if (/^\d+$/.test(v)) {
    return { field: "quantity", value: parseInt(v) };
  }

  // Matches a known part number
  if (partNumbers && partNumbers.length > 0) {
    const match = partNumbers.find(([pn]) =>
      pn && pn.toString().toUpperCase() === v.toUpperCase()
    );
    if (match) return { field: "partNumber", value: v };
  }

  // Lot-like: alphanumeric mix, 6–20 chars
  if (/^[A-Z0-9]{6,20}$/.test(v)) {
    return { field: "lotNumber", value: v };
  }

  return { field: "unknown", value: v };
}

export const mapExtractedData = (allBarcodes = [], ocrText = "", placeholders = {}, partNumbers = []) => {
  const ph = {
    partNumber:      (placeholders?.partNumber?.value      || DEFAULT_PLACEHOLDERS.partNumber.value).toUpperCase(),
    quantity:        (placeholders?.quantity?.value        || DEFAULT_PLACEHOLDERS.quantity.value).toUpperCase(),
    lotNumber:       (placeholders?.lotNumber?.value       || DEFAULT_PLACEHOLDERS.lotNumber.value).toUpperCase(),
    manufactureDate: (placeholders?.manufactureDate?.value || DEFAULT_PLACEHOLDERS.manufactureDate.value).toUpperCase(),
  };

  const text = ocrText
    .toUpperCase()
    .replace(/[^A-Z0-9\-_.:/ \n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  console.log("[mapper] OCR text:", text);
  console.log("[mapper] Placeholders:", ph);
  console.log("[mapper] Barcodes:", allBarcodes);

  const result = {
    fields: ["partNumber", "quantity", "lotNumber", "manufactureDate"],
    partNumber: null,
    quantity: null,
    lotNumber: null,
    manufactureDate: "-",
    partNumberExtracted: false,
    quantityExtracted: false,
    lotNumberExtracted: false,
    manufdateExtracted: false,
    allFieldsExtracted: false,
  };

  // ── STEP 1: OCR extraction ──────────────────────────────────────────────

  // Part number from OCR — try configured placeholder first, then common alternates
  const partOcr = buildAlphaPattern(ph.partNumber).exec(text);
  if (partOcr) {
    result.partNumber = partOcr[1];
    result.partNumberExtracted = true;
  } else {
    // Fallback: try common label variants (P/N, PN, TYPE, PART NUMBER, ITEM NO)
    const altPartPatterns = [
      /P\s*[\/\\]\s*N[^A-Z0-9]+([A-Z0-9][A-Z0-9\-_./]*)/i,
      /P\s*N[^A-Z0-9]+([A-Z0-9][A-Z0-9\-_./]*)/i,
      /T\s*Y\s*P\s*E[^A-Z0-9]+([A-Z0-9][A-Z0-9\-_./]*)/i,
      /P\s*A\s*R\s*T[^A-Z0-9]+([A-Z0-9][A-Z0-9\-_./]*)/i,
      /I\s*T\s*E\s*M[^A-Z0-9]+([A-Z0-9][A-Z0-9\-_./]*)/i,
    ];
    for (const pat of altPartPatterns) {
      const m = pat.exec(text);
      if (m) {
        result.partNumber = m[1];
        result.partNumberExtracted = true;
        break;
      }
    }
  }

  // Quantity from OCR
  const qtyOcr = buildNumericPattern(ph.quantity).exec(text);
  if (qtyOcr) {
    const num = parseInt(qtyOcr[1].replace(/O/g, "0").replace(/S/g, "5").replace(/B/g, "8"));
    if (!isNaN(num)) {
      result.quantity = num;
      result.quantityExtracted = true;
    }
  }

  // Lot from OCR
  const lotOcr = buildAlphaPattern(ph.lotNumber).exec(text);
  if (lotOcr) {
    result.lotNumber = [lotOcr[1]];
    result.lotNumberExtracted = true;
  }

  // Date from OCR
  const dateOcr = buildAlphaPattern(ph.manufactureDate).exec(text);
  if (dateOcr) {
    result.manufactureDate = dateOcr[1];
    result.manufdateExtracted = true;
  }

  // ── STEP 2: Fill missing fields from barcodes ──────────────────────────
  for (const barcodeValue of allBarcodes) {
    const { field, value } = matchBarcodeToField(barcodeValue, partNumbers);

    if (field === "partNumber" && !result.partNumberExtracted) {
      result.partNumber = value;
      result.partNumberExtracted = true;
    } else if (field === "quantity" && !result.quantityExtracted) {
      result.quantity = value;
      result.quantityExtracted = true;
    } else if (field === "lotNumber" && !result.lotNumberExtracted) {
      result.lotNumber = [value];
      result.lotNumberExtracted = true;
    }
  }

  result.allFieldsExtracted =
    result.partNumberExtracted && result.quantityExtracted && result.lotNumberExtracted;

  console.log("[mapper] result:", JSON.stringify(result));
  return result;
};
