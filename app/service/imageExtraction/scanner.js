import { extractOCR } from "./ocr.js";
import { mapExtractedData } from "./mapper.js";
import { base64ToBuffer } from "./utils.js";

export const processScanner = async (data) => {
  try {
    const { image_base64, partNumbers = [] } = data;

    const buffer = base64ToBuffer(image_base64);
    const ocrData = await extractOCR(buffer);

    console.log("OCR RAW:", ocrData);

    const extracted = await mapExtractedData(
      {},
      ocrData,
      {},
      { partNumbers }
    );

    console.log("FINAL:", extracted);

    if (!extracted.partNumberExtracted) {
      return {
        statusCode: 500,
        message: "Part Number not extracted",
        partNumberExtracted: false,
      };
    }

    return {
      statusCode: 200,
      message: "Data is valid",
      details: [extracted],
    };
  } catch (err) {
    return {
      statusCode: 500,
      message: err.message,
    };
  }
};