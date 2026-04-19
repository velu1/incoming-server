import Tesseract from "tesseract.js";

export const extractOCR = async (buffer) => {
  const { data: { text } } = await Tesseract.recognize(buffer, "eng");
  return text.replace(/[()]/g, "").toUpperCase();
};