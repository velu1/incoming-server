import sharp from "sharp";
import {
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
} from "@zxing/library";

const reader = new MultiFormatReader();

async function decodeRegion(buffer, left, top, width, height) {
  try {
    const { data, info } = await sharp(buffer)
      .extract({ left, top, width, height })
      .grayscale()
      .normalise()
      .sharpen()
      .threshold(160)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const clamped = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
    const source = new RGBLuminanceSource(clamped, info.width, info.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    return reader.decode(bitmap).getText();
  } catch {
    return null;
  }
}

// Scan the full image + horizontal strips to find all barcodes
export const extractAllBarcodes = async (buffer) => {
  const meta = await sharp(buffer).metadata();
  const w = meta.width;
  const h = meta.height;

  if (!w || !h || w < 1 || h < 1) {
    console.warn("[barcode] invalid image dimensions, skipping barcode scan");
    return [];
  }

  // Divide image into horizontal bands (each barcode is in its own row band)
  const BANDS = 8;
  const bandH = Math.floor(h / BANDS);

  const results = new Set();

  // Full image scan first
  const full = await decodeRegion(buffer, 0, 0, w, h);
  if (full) results.add(full.trim());

  // Per-band scan
  for (let i = 0; i < BANDS; i++) {
    const top = i * bandH;
    const height = i === BANDS - 1 ? h - top : bandH;
    const val = await decodeRegion(buffer, 0, top, w, height);
    if (val) results.add(val.trim());
  }

  const found = [...results];
  console.log("[barcode] all decoded values:", found);
  return found;
};

// Keep single-barcode export for backward compatibility
export const extractBarcode = async (buffer) => {
  const all = await extractAllBarcodes(buffer);
  return all.length > 0 ? all[0] : null;
};
