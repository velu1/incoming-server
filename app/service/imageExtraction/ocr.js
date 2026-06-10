import Tesseract from "tesseract.js";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANG_PATH = path.resolve(__dirname, "../../../");

const MIN_WIDTH = 2000;

export const extractOCR = async (buffer) => {
  // Get current dimensions
  const meta = await sharp(buffer).metadata();
  console.log(`[OCR] original size: ${meta.width}x${meta.height}`);

  // Upscale if image is too small for good OCR
  let pipeline = sharp(buffer);
  if (meta.width && meta.width < MIN_WIDTH) {
    const scale = Math.ceil(MIN_WIDTH / meta.width);
    pipeline = pipeline.resize({
      width: meta.width * scale,
      height: meta.height ? meta.height * scale : undefined,
      kernel: sharp.kernel.lanczos3,
    });
    console.log(`[OCR] upscaled ${scale}x to ${meta.width * scale}x${meta.height ? meta.height * scale : "?"}`);
  }

  const preprocessed = await pipeline
    .grayscale()
    .normalise()
    .sharpen()
    .toBuffer();

  const { data: { text } } = await Tesseract.recognize(preprocessed, "eng", {
    langPath: LANG_PATH,
    cacheMethod: "none",
    gzip: false,
    logger: () => {},
    tessedit_pageseg_mode: "11",       // sparse text — finds text scattered between barcodes
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.:/ ",
  });

  const result = text.replace(/\n/g, " ").toUpperCase();
  console.log("[OCR] raw extracted text:", result);
  return result;
};
