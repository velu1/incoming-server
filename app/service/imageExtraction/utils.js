export const base64ToBuffer = (b64) =>
  Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ""), "base64");

export const extractNumbers = (str) => {
  const num = str.replace(/[^0-9]/g, "");
  return num ? parseInt(num) : null;
};