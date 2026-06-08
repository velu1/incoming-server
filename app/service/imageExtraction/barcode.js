import sharp from "sharp";
import {
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
} from "@zxing/library";

export const extractBarcode = async (buffer) => {
  try {
    const { data, info } = await sharp(buffer)
      .grayscale()
      .normalise()
      .sharpen()
      .threshold(160)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const clamped = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
    const source = new RGBLuminanceSource(clamped, info.width, info.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    return new MultiFormatReader().decode(bitmap).getText();
  } catch {
    return null;
  }
};
