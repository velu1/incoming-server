import Tesseract from "tesseract.js";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

// Points to the eng.traineddata file shipped in the project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANG_PATH = path.resolve(__dirname, "../../../../");

export const extractOCR = async (buffer) => {
  const preprocessed = await sharp(buffer)
    .grayscale()
    .normalise()
    .sharpen()
    .toBuffer();

  const { data: { text } } = await Tesseract.recognize(preprocessed, "eng", {
    langPath: LANG_PATH,
    cacheMethod: "none",
    logger: () => {},
  });

  return text.replace(/\n/g, " ").toUpperCase();
};
