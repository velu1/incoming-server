import { extractOCR } from "./ocr.js";
import { extractAllBarcodes } from "./barcode.js";
import { mapExtractedData } from "./mapper.js";
import { base64ToBuffer } from "./utils.js";

export const processScanner = async ({ image_base64, partNumbers = [], placeholders = {} }) => {
  const buffer = base64ToBuffer(image_base64);

  const [allBarcodes, ocrText] = await Promise.all([
    extractAllBarcodes(buffer),
    extractOCR(buffer),
  ]);

  console.log("[scanner] barcodes found:", allBarcodes);
  const extracted = mapExtractedData(allBarcodes, ocrText, placeholders, partNumbers);

  if (!extracted.partNumberExtracted) {
    return {
      statusCode: 500,
      message:
        "Part Number from the Image could not be extracted! Add the part number in the Master Data & RETRY!!",
      partNumberExtracted: false,
    };
  }

  return {
    statusCode: 200,
    message: "Data is valid",
    details: [extracted],
  };
};
