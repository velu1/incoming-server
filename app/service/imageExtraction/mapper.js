import { extractNumbers } from "./utils.js";

export const mapExtractedData = async (
  decodedData = {},
  ocrData = "",
  template = {},
  extractedInfo = {}
) => {
  const cleanOCR = ocrData
    .replace(/[^A-Z0-9\-:\s]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();

  let result = {
    fields: ["partNumber", "quantity", "lotNumber"],
  };

  let fieldCounter = 0;

  // ✅ STEP 1: PART NUMBER (STRICT LABEL BASED)
 let partMatch = cleanOCR.match(/PART\s*NO[:\s]*([A-Z0-9]+-\d+-[A-Z0-9]+)/);

if (!partMatch) {
  // fallback: handle space instead of hyphen
  partMatch = cleanOCR.match(/PART\s*NO[:\s]*([A-Z0-9]+-\d+)\s*([A-Z0-9]+)/);
}

  if (!partMatch) {
    return { partNumberExtracted: false };
  }

  result.partNumber = partMatch[1] || partMatch[0];
  result.partNumberExtracted = true;
  fieldCounter++;

  // ✅ STEP 2: QUANTITY (STRICT LABEL)
  let qtyMatch = cleanOCR.match(/QUANTITY[:\s]*([0-9SOB]+)/);

  if (qtyMatch) {
    let val = qtyMatch[1]
      .replace(/O/g, "0")
      .replace(/S/g, "5")
      .replace(/B/g, "8");

    result.quantity = parseInt(val);
    result.quantityExtracted = true;
  }

  // ✅ STEP 3: LOT NUMBER
  const lotMatch = cleanOCR.match(/LOT\s*NO[:\s]*([0-9]+)/);
  if (lotMatch) {
    result.lotNumber = [lotMatch[1]];
    result.lotNumberExtracted = true;
    fieldCounter++;
  }

  // ✅ FINAL STATUS
  result.allFieldsExtracted = fieldCounter >= 2;

  return result;
};