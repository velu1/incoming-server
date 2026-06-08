export const mapExtractedData = (barcodeText = "", ocrText = "") => {
  const text = ocrText
    .replace(/[^A-Z0-9\-:\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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

  // Prefer barcode for part number; fall back to OCR label
  if (barcodeText) {
    result.partNumber = barcodeText.trim();
    result.partNumberExtracted = true;
  } else {
    const partMatch = text.match(/PART\s*NO[:\s]*([A-Z0-9][-A-Z0-9]*)/);
    if (partMatch) {
      result.partNumber = partMatch[1];
      result.partNumberExtracted = true;
    }
  }

  if (!result.partNumberExtracted) return result;

  // Quantity — tolerate O→0, S→5, B→8 OCR errors
  const qtyMatch = text.match(/QUANTITY[:\s]*([0-9SOB]+)/);
  if (qtyMatch) {
    const cleaned = qtyMatch[1]
      .replace(/O/g, "0")
      .replace(/S/g, "5")
      .replace(/B/g, "8");
    result.quantity = parseInt(cleaned);
    result.quantityExtracted = true;
  }

  // Lot number
  const lotMatch = text.match(/LOT\s*NO[:\s]*([A-Z0-9]+)/);
  if (lotMatch) {
    result.lotNumber = [lotMatch[1]];
    result.lotNumberExtracted = true;
  }

  // Manufacture date (YYYYMMDD or YYWW style)
  const dateMatch = text.match(/DATE[:\s]*([0-9]{4,8})/);
  if (dateMatch) {
    result.manufactureDate = dateMatch[1];
    result.manufdateExtracted = true;
  }

  result.allFieldsExtracted =
    result.partNumberExtracted && result.quantityExtracted && result.lotNumberExtracted;

  return result;
};
