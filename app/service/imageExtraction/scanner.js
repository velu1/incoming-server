// import { extractOCR } from "./ocr.js";
import { extractBarcode } from "./barcode.js";
import { mapExtractedData } from "./mapper.js";
import { base64ToBuffer } from "./utils.js";

export const processScanner = async ({ image_base64, partNumbers = [] }) => {
  const buffer = base64ToBuffer(image_base64);

  // OCR disabled temporarily — high RAM usage
  // const [barcodeText, ocrText] = await Promise.all([
  //   extractBarcode(buffer),
  //   extractOCR(buffer),
  // ]);

  const barcodeText = await extractBarcode(buffer);
  const ocrText = "";

  const extracted = mapExtractedData(barcodeText || "", ocrText);

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
