import { CreateCaptureStock } from "../../../interface/incoming/partsIn";
import { getDB } from "../../dbInstance";
import { convertToMongoDate } from "../../dateconversion";
let axios = require("axios");
const config = require("../../../../config/index");
import sharp from "sharp";
import {
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader
} from "@zxing/library";

import Tesseract from "tesseract.js";
  import { processScanner } from "../../../imageExtraction/scanner.js";



import {
  FormattedStockData,
  getByPartNumber,
  updateInoviceTranscation,
} from "./services/partsIn";
import { log } from "console";

const { BlobServiceClient } = require("@azure/storage-blob");
// Azure Blob Storage credentials
const AZURE_STORAGE_CONNECTION_STRING = config.AZURE_STORAGE_CONNECTION_STRING;
const containerName = config.CONTAINER_NAME; // Replace with your Blob container name

/**
 * Uploads a Base64 image to Azure Blob Storage.
 * @param {string} base64Image - The Base64 encoded image string.
 * @param {string} blobName - The name of the blob (file name in Azure Blob Storage).
 */

interface EntityDetails {
  partNumber: { value: string; isSelected: boolean };
  quantity: { value: string; isSelected: boolean };
  lotNumber: { value: string; isSelected: boolean };
  manufDate: { value: string; isSelected: boolean };
  tertiaryData: any[];
}

interface OCRData {
  partNumber: string[];
  quantity: string[];
  lotNumber: string[];
  manufDate: string[];
}

export const invoicePresent = async (mongoConnString: string) => {
  const db = await getDB(mongoConnString);
  const result = await db.printerConfigs
    .findOne({ type: "partsInPrinterConfig" })
    .select("invoice");

  return result;
};

export const fastapiData = async (data: any, mongoConnString: string) => {
  const db = await getDB(mongoConnString);

  let masterData = await db.masterdata
    .find({ isDeleted: false })
    .select("partNumber internalPartNo quantity");

  interface Part {
    partNumber: string;
    internalPartNo: any;
    quantity: number;
  }
  let partNumbers;
  const isInvoicePresent = await invoicePresent(mongoConnString);

  if (isInvoicePresent.invoice) {
    let invoiceData = await db.InvoiceData.find({ receiptNumber: data }).select(
      "partNumber"
    );
    const invoicePartNumbers = invoiceData.map((doc: any) => doc.partNumber);
    partNumbers = masterData
      .filter((doc: Part) => invoicePartNumbers.includes(doc.partNumber))
      .map((doc: Part) => [doc.partNumber, doc.internalPartNo, doc.quantity]);
  } else {
    partNumbers = masterData.map((doc: Part) => [
      doc.partNumber,
      doc.internalPartNo,
      doc.quantity,
    ]);
  }

  let entityMappingData = {
    partNumber: { value: "", isSelected: true },
    quantity: { value: "", isSelected: true },
    manufDate: { value: "", isSelected: true },
    lotNumber: { value: "", isSelected: true },
    tertiaryData: [],
  };

  return { partNumbers, entityMappingData };
};

export const getAssociateTemplates = async (
  mongoConnString: string,
  partNumber: string
) => {
  const db = await getDB(mongoConnString);
  const masterDataResult = await db.masterdata.findOne({
    partNumber: partNumber,
  });
  if (masterDataResult) {
    const templatesResult = await db.inwardTemplate.find({
      manufacturer: masterDataResult.manufacturer,isDelete :false
    });
    return templatesResult;
  } else {
    return null;
  }
};

export const fastApi = async (data: any, mongoConnString: string) => {
  let fastapiUrl = config.config.fastapiUrl;
  try {

    // const response = await axios.post(`${fastapiUrl}/scanner_new`, data);
    // response.data = {
    //   ...response.data,

    // };
    // console.log("reqDataaa", data);

     let responseData = {
      data: { details :[{
          "fields": ["partNumber", "quantity", "lotNumber", "manufactureDate", "internalPartNo"],
          "partNumber": "4E-060019-3R",
          "quantity": 5000,
          "lotNumber": [
              "14773695"
          ],
          "manufactureDate": "-",
          "invoiceDate": "2025-04-29T18:36:11.981Z",
          "maker": "ROYAL OHM PB-FREE",
          "internalPartNo": "INT51",
          "partLocation": "LOC51",
          "entryPreferences": "auto",
          "allFieldsExtracted": true
        }],
        statusCode: 200
      },


      }

    return responseData.data;


// let response = await processScanner({
//   image_base64: data?.image_base64,
//   partNumbers: data?.partNumbers,
// });
// console.log("resssssssssssssssssssssssssssssssss", response);

//  response.data = {
//       ...response.data,

//     };
//      return response;

// console.log("resultresultresult",result);


  } catch (error: any) {
    console.log("errrrrrrrrrrrrrrrrrrrrrrrrrrrrr", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as any;
      if (axiosError?.response?.status === 302) {
        // Use regex to extract the PartNumber
        const message = axiosError.response?.data?.message;
        const partNumber = message.match(/PartNumber\s*:\s*(\w+)/);

        let associateTemplates: any = await getAssociateTemplates(
          mongoConnString,
          partNumber[1]
        );
        let associateTemplatesData = [];
        if (associateTemplates.length > 0) {
          associateTemplatesData = associateTemplates;
        }

        return {
          message: axiosError.response?.data?.message,
          statusCode: 500,
          newTemplate: true,
          associateTemplate: associateTemplatesData,
          partNumber: partNumber[1],
        };
      }
      // Handle specific Axios error codes
      if (axiosError.code === "ECONNREFUSED") {
        return {
          message:
            "Connection refused. Please check if the server is running and accessible.",
          statusCode: 500,
        };
      } else if (axiosError.code === "ERR_BAD_RESPONSE") {
        if (axiosError.response?.data?.partNumberExtracted === false) {
          return {
            message: axiosError.response?.data?.message,
            statusCode: 500,
          };
        } else if (
          axiosError.response?.data.detail ===
          "An error occurred: All connection attempts failed"
        ) {
          return {
            message:
              axiosError.response?.data.detail ||
              "Error capturing data from camera",
            statusCode: 500,
          };
        } else if (
          axiosError.response?.data.detail ===
          "500 Internal Server Error received, aborting application."
        ) {
          return {
            message:
              axiosError.response?.data.detail ||
              "Error capturing data from camera",
            statusCode: 500,
          };
        } else {
          return {
            message:
              axiosError.response?.data?.detail ||
              axiosError.response?.data?.message ||
              axiosError.response?.data,
            statusCode: 500,
          };
        }
      } else {
        // Handle non-Axios errors

        return {
          message: "An unknown error occurred.",
          statusCode: 500,
        };
      }
    }
  }
};

export const imageStore = async (
  images: any,
  uniqueId: string,
  mongoConnString: string
) => {
  const db = await getDB(mongoConnString);
  const base64Image = images;
  const blobName = uniqueId + ".png";
  let BloBResponse: any = await uploadBase64ImageToBlob(
    base64Image.split(",")[1],
    blobName
  );
};

async function uploadBase64ImageToBlob(base64Image: any, blobName: any) {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("Azure Storage connection string is not defined.");
  }

  try {
    // Create the BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure the container exists
    await containerClient.createIfNotExists();
    console.log(`Container "${containerName}" is ready.`);

    // Convert Base64 to Buffer
    const buffer = Buffer.from(base64Image, "base64");

    // Get a block blob client for the blob
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the buffer to the blob
    const uploadResponse = await blockBlobClient.upload(buffer, buffer.length);
    console.log(
      `Blob "${blobName}" is uploaded successfully.`,
      uploadResponse.requestId
    );
    return { status: true, data: uploadResponse };
  } catch (error: any) {
    console.error(
      "Error uploading Base64 image to Blob Storage:",
      error.message
    );
    return { status: false, message: error.message };
  }
}

export async function trailRun(input: any, mongoConnString: string) {
  const db = await getDB(mongoConnString);
  let datas = await fastapiData(input.receiptNumber, mongoConnString);
  let masterData = await db.masterdata
    .find({ isDeleted: false })
    .select("partNumber quantity internalPartNo");
  let partNumber = masterData.map((doc: any) => [
    doc.partNumber,
    doc.internalPartNo,
    doc.quantity,
  ]);
  let data = input;

  data.partNumbers = partNumber;
  // data.ecia_standards = datas?.barcodeStandardData?.entityDetails;
  let cameraCapturedata: any = await fastApi(data, mongoConnString);
  if (cameraCapturedata?.status_code != 200) {
    return {
      message: cameraCapturedata?.message,
      statusCode: cameraCapturedata?.status_code,
    };
  } else {
    return {
      message: cameraCapturedata ? "Trail SucessFull!" : "Error Trail",
      data: cameraCapturedata?.details,
      statusCode: 200,
    };
  }
}

function cleanBase64(base64: string) {
  return base64.includes(",")
    ? base64.split(",")[1]
    : base64;
}

export async function ocrBase64(base64: string) {
  base64 = cleanBase64(base64);

  const buffer = Buffer.from(base64, "base64");
  const { data } = await Tesseract.recognize(buffer, "eng");
  return data.text.replace(/\n/g, " ").toUpperCase();
}


export async function decodeBarcodeBase64(base64: string) {
  try {
    base64 = cleanBase64(base64);

    const img = Buffer.from(base64, "base64");

    // 🔥 PREPROCESS for thermal labels
    const { data, info } = await sharp(img)
      .grayscale()
      .normalise()      // boost contrast
      .sharpen()        // sharpen edges
      .threshold(160)  // binarize
      .raw()
      .toBuffer({ resolveWithObject: true });

    const clamped = new Uint8ClampedArray(
      data.buffer,
      data.byteOffset,
      data.byteLength
    );

    const source = new RGBLuminanceSource(clamped, info.width, info.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));

    return new MultiFormatReader().decode(bitmap).getText();
  } catch (err) {
    console.warn("Barcode not detected");
    return null;
  }
}



export function mapExtractedData(barcodeText: string, ocrText: string, template: any) {
  const result = {
    partNumber: "",
    quantity: null as number | null,
    fields: {} as any,
    allFieldsExtracted: false
  };

  // Clean thermal OCR noise
  const text = ocrText
    .toUpperCase()
    .replace(/[|()><\[\]]/g, " ")
    .replace(/0\(/g, "0")
    .replace(/\s+/g, " ");

  /* -------- PART NUMBER -------- */
  const partMatch = text.match(/TYPE\s+([A-Z0-9()]+)/);
  if (partMatch) result.partNumber = partMatch[1];

  /* -------- LOT -------- */
  const lotMatch = text.match(/LOT\s+([A-Z0-9]+)/);
  if (lotMatch) result.fields.lot = lotMatch[1];

  /* -------- QUANTITY (OCR tolerant) -------- */
  const qtyMatch = text.match(/(Q|QQ|QTY|QATY)\s*([0-9O]+)/);
  if (qtyMatch) {
    const cleanQty = qtyMatch[2].replace(/O/g, "0");
    result.quantity = parseInt(cleanQty);
  }

  /* -------- DATE CODE -------- */
  const dateMatch = text.match(/DATE\s*([0-9]+)/);
  if (dateMatch) result.fields.date = dateMatch[1];

  /* -------- CODE NO -------- */
  const codeMatch = text.match(/CODE\s*NO\s*([0-9]+)/);
  if (codeMatch) result.fields.codeNo = codeMatch[1];

  result.allFieldsExtracted =
    !!result.partNumber &&
    !!result.quantity &&
    !!result.fields.lot;

  return result;
}




export async function CreateCaptureStock(
  input: CreateCaptureStock,
  _user: any,
  // _printerData: PrinterData,
  mongoConnString: string,
  code: string
) {

  const db = await getDB(mongoConnString);

  try {
    let datas: any;

    datas = await fastapiData(input.receiptNumber, mongoConnString);
    console.log("datasdatas", datas);


    const isInvoiceEnabled = await invoicePresent(mongoConnString);

    let reqData = {
      image_base64: input.image_base64 ? input.image_base64 : "",
      partNumbers: datas?.partNumbers,
      ecia_standards: datas?.barcodeStandardData?.entityDetails,
      trialRun: input.trialRun,
      templateName: "",
      ocr: {
        disable: true,
        data: {
          partNumber: { value: "", isSelected: false },
          quantity: { value: "", isSelected: false },
          manufDate: { value: "", isSelected: false },
          lotNumber: { value: "", isSelected: false },
        },
      },
      barcode: {
        disable: true,
        selectedData: "",
        type: "",
        delimiter: {
          type: "",
          totalField: "",
          partNumber: { position: "", identifier: "" },
          quantity: { position: "", identifier: "" },
          manufDate: { position: "", identifier: "" },
          lotNumber: { position: "", identifier: "" },
          identifier: false,
        },
        positional: {
          partNumber: { startIndex: "", endIndex: "" },
          quantity: { startIndex: "", endIndex: "" },
          manufDate: { startIndex: "", endIndex: "" },
          lotNumber: { startIndex: "", endIndex: "" },
        },
      },
      tenantId: mongoConnString,
      invoice: isInvoiceEnabled.invoice ? true : false,
    };
    let cameraCapturedata: any = await fastApi(reqData, mongoConnString);
    console.log("cameraCapturedatacameraCapturedata", cameraCapturedata);


    if (cameraCapturedata.statusCode === 401) {
      return {
        message: "Select the Template",
        status: true,
        statusCode: 401,
      };
    }
    if (
      cameraCapturedata.statusCode === 500 ||
      cameraCapturedata.statusCode === 404
    ) {
      return cameraCapturedata;
    }
    let cameraCapture = {
      ...cameraCapturedata.details[0],
      partNumber: cameraCapturedata.details[0].partNumber,
      receiptNumber: input.receiptNumber,
      extracted_sticker: input.image_base64,
    };
    let maping = {
      partNumber: cameraCapture?.partNumber,
      receiptNumber: input.receiptNumber,
    };
    let manufacture: any;

    manufacture = await getByPartNumber(mongoConnString, maping);
    console.log("manufacturemanufacture", maping);

    let formattedStockDataArray: FormattedStockData[] = [];

    if (!manufacture?.data) {
      return {
        message: manufacture.message,
        status: 404,
        statusCode: 400,
      };
    }

console.log("cameraCapturecameraCapture", cameraCapture);

const result = cameraCapturedata.details.map((detail: any) => {
          const output: any = {};
          const fields = detail.fields || [];

          fields.forEach((field: any) => {
            if (field in detail) {
              output[field] = detail[field];
            }
          });

          return output;
        });
        console.log("resultresultresult", result);

        let format = formattedStockDataArray.map((m) => ({
          ...result[0],
          fields: cameraCapturedata.details[0].fields,
          uniqueId: m.uniqueId,
          manufacturer: m.manufacturer,
          partLocation: m.partLocation,
          receiptNumber: m.receiptNumber,
          entryPreferences: m.entryPreferences,
          internalPartNo: m.internalPartNo,
          idCode: m.idCode,
          extractedImage: m.extractedImage,
          dateOfReceipt: m?.dateOfReceipt,
          description: m?.description,
        }));
        console.log("formatformat", format);

        let queryResult: any = format;
        let { auditType } = await db.printerConfigs
          .findOne({
            type: "partsInPrinterConfig",
          })
          .select("auditType");
        if (auditType && auditType !== "Full") {
          let transation = {
            receiptNumber: input.receiptNumber,
            internalPartNo: formattedStockDataArray[0].internalPartNo,
            partNumber: formattedStockDataArray[0].partNumber,
            quantity: formattedStockDataArray[0].quantity,
          };
          const isInvoicePresent = await invoicePresent(mongoConnString);
          if (isInvoicePresent.invoice) {
            await updateInoviceTranscation(transation, mongoConnString);
          }
        }
        console.log("queryResultqueryResult", queryResult);

        let data = {
          ...result[0],
          fields: cameraCapturedata.details[0].fields,
          extracted_sticker: cameraCapture.extracted_sticker,
        };
        return {
          message: queryResult
            ? "Stock created successfully!"
            : "Error in creating stock",
          data,
          statusCode: 200,
        };
  } catch (error) {
    console.log("errrrr", error);

    return {
      message: "Something went wrong, Please contact admin!!",
      error: error,
      status: 500,
      statusCode: 500,
    };
  }
}

export async function audit(input: any, mongoConnString: string) {
  const db = await getDB(mongoConnString);
  let auditRun = await db.stock.findOne({
    uniqueId: input.auditUUID,
  });

  if (auditRun?.auditStatus === "Noaudit") {
    return {
      data: `${input.auditUUID}`,
      statusCode: 404,
      message:
        auditRun.auditStatus === "Noaudit"
          ? `${input.auditUUID} Cannot be Audit`
          : `${input.auditUUID} Not Found`,
    };
  }
  if (auditRun && auditRun.entryPreferences !== "manual") {
    let sendStatus: any = {};
    let data: any = {
      partNumber: auditRun.partNumber,
      quantity: auditRun.quantity,
      lotNumber: auditRun.lotNumber,
      manufactureDate: auditRun.manufactureDate,
      dateOfReceipt: auditRun?.dateOfReceipt,
      manufacturer: auditRun.manufacturer,
      internalPartNo: auditRun.internalPartNo,
      idCode: auditRun.idCode,
      partLocation: auditRun.partLocation,
      entryPreferences: auditRun.entryPreferences,
      extracted_sticker: input.extracted_sticker,
    };
    if (auditRun?.auditStatus === "successful") {
      data.auditStatus = "auditDone";

      return data;
    } else {
      const isInvoicePresent = await invoicePresent(mongoConnString);

      let { auditType } = await db.printerConfigs
        .findOne({
          type: "partsInPrinterConfig",
        })
        .select("auditType");
      if (isInvoicePresent.invoice) {
        const invoiceTransaction = await db.invoiceTranscation.findOne({
          receiptNumber: input?.receiptNumber,
          internalPartNo: auditRun?.internalPartNo,
        });

        let totalIncomingQuantity =
          invoiceTransaction?.inwardQty + auditRun?.quantity;
        if (totalIncomingQuantity > invoiceTransaction?.receiptQuantity) {
          sendStatus.status = "invoiceCompleted";
          sendStatus.toastMessage =
            "Invoice quantity for this pallet is completed";
          return sendStatus;
        }

        let constructedAuditData;
        let auditMatchPercentage;

        if (auditType === "Full") {
          constructedAuditData = [
            {
              field: "Part Number",
              extractedDataa: input?.partNumber,
              dbDataa: auditRun?.partNumber,
              auditCheck:
                input?.partNumber == auditRun?.partNumber ? true : false,
            },
            {
              field: "Quantity",
              extractedDataa: input?.quantity,
              dbDataa: auditRun?.quantity,
              auditCheck: input?.quantity === auditRun?.quantity ? true : false,
            },
          ];
          if (input?.lotNumber) {
            constructedAuditData.push({
              field: "Lot Number",
              extractedDataa: input?.lotNumber,
              dbDataa: auditRun?.lotNumber,
              auditCheck:
                input?.lotNumber[0] == auditRun?.lotNumber[0] ? true : false,
            });
          }
          if (input?.manufDate) {
            constructedAuditData.push({
              field: "Manuf Date",
              extractedDataa: new Date(
                convertToMongoDate(input?.manufDate)
              ).toDateString(),
              dbDataa: new Date(auditRun?.manufactureDate).toDateString(),
              auditCheck:
                new Date(convertToMongoDate(input?.manufDate)).getTime() ===
                new Date(auditRun?.manufactureDate).getTime()
                  ? true
                  : false,
            });
          }

          let t = constructedAuditData.filter((item) => item.auditCheck).length;
          let f = constructedAuditData.length - t;

          auditMatchPercentage = (t / (t + f)) * 100;

          if (Number(auditMatchPercentage) === 100) {
            let transation = {
              receiptNumber: input?.receiptNumber,
              internalPartNo: auditRun?.internalPartNo,
              partNumber: auditRun.partNumber,
              quantity: auditRun.quantity,
            };
            const isInvoicePresent = await invoicePresent(mongoConnString);
            if (isInvoicePresent.invoice) {
              await updateInoviceTranscation(transation, mongoConnString);
            }
          }

          let auditResult = await db.stock.findOneAndUpdate(
            { uniqueId: input.auditUUID },
            { auditStatus: "successful" }
          );

          if (auditResult) {
            data.auditStatus = "auditSuccessful";
            return data;
          }
        } else if (auditType === "Random") {
          constructedAuditData = [
            {
              field: "Part Number",
              extractedDataa: input?.partNumber,
              dbDataa: auditRun?.partNumber,
              auditCheck:
                input?.partNumber == auditRun?.partNumber ? true : false,
            },
            {
              field: "Quantity",
              extractedDataa: input?.quantity,
              dbDataa: auditRun?.quantity,
              auditCheck: input?.quantity === auditRun?.quantity ? true : false,
            },
          ];
          if (input?.lotNumber) {
            constructedAuditData.push({
              field: "Lot Number",
              extractedDataa: input?.lotNumber,
              dbDataa: auditRun?.lotNumber,
              auditCheck:
                input?.lotNumber[0] == auditRun?.lotNumber[0] ? true : false,
            });
          }
          if (input?.manufDate) {
            constructedAuditData.push({
              field: "Manuf Date",
              extractedDataa: new Date(
                convertToMongoDate(input?.manufDate)
              ).toDateString(),
              dbDataa: new Date(auditRun?.manufactureDate).toDateString(),
              auditCheck:
                new Date(convertToMongoDate(input?.manufDate)).getTime() ===
                new Date(auditRun?.manufactureDate).getTime()
                  ? true
                  : false,
            });
          }
          let t = constructedAuditData.filter((item) => item.auditCheck).length;
          let f = constructedAuditData.length - t;

          auditMatchPercentage = (t / (t + f)) * 100;
          if (Number(auditMatchPercentage) === 100) {
            let auditResult = await db.stock.findOneAndUpdate(
              { uniqueId: input.auditUUID },
              { auditStatus: "successful" }
            );
            if (auditResult) {
              data.auditStatus = "auditSuccessful";
              return data;
            }
          }
        } else {
          await db.stock.findOneAndUpdate(
            { uniqueId: input.auditUUID },
            { auditStatus: "failed" }
          );
          sendStatus.status = "auditFailed";
          return {
            sendStatus,
            auditRun,
            constructedAuditData,
            auditMatchPercentage,
          };
        }
      } else {
        let constructedAuditData;
        let auditMatchPercentage;

        if (auditType === "Full") {
          constructedAuditData = [
            {
              field: "Part Number",
              extractedDataa: input?.partNumber,
              dbDataa: auditRun?.partNumber,
              auditCheck:
                input?.partNumber == auditRun?.partNumber ? true : false,
            },
            {
              field: "Quantity",
              extractedDataa: input?.quantity,
              dbDataa: auditRun?.quantity,
              auditCheck: input?.quantity === auditRun?.quantity ? true : false,
            },
          ];
          if (input?.lotNumber) {
            constructedAuditData.push({
              field: "Lot Number",
              extractedDataa: input?.lotNumber,
              dbDataa: auditRun?.lotNumber,
              auditCheck:
                input?.lotNumber[0] == auditRun?.lotNumber[0] ? true : false,
            });
          }
          if (input?.manufDate) {
            constructedAuditData.push({
              field: "Manuf Date",
              extractedDataa: new Date(
                convertToMongoDate(input?.manufDate)
              ).toDateString(),
              dbDataa: new Date(auditRun?.manufactureDate).toDateString(),
              auditCheck:
                new Date(convertToMongoDate(input?.manufDate)).getTime() ===
                new Date(auditRun?.manufactureDate).getTime()
                  ? true
                  : false,
            });
          }

          let t = constructedAuditData.filter((item) => item.auditCheck).length;
          let f = constructedAuditData.length - t;

          auditMatchPercentage = (t / (t + f)) * 100;

          if (Number(auditMatchPercentage) === 100) {
            let transation = {
              receiptNumber: input?.receiptNumber,
              internalPartNo: auditRun?.internalPartNo,
              partNumber: auditRun.partNumber,
              quantity: auditRun.quantity,
            };
            const isInvoicePresent = await invoicePresent(mongoConnString);
            if (isInvoicePresent.invoice) {
              await updateInoviceTranscation(transation, mongoConnString);
            }
          }

          let auditResult = await db.stock.findOneAndUpdate(
            { uniqueId: input.auditUUID },
            { auditStatus: "successful" }
          );

          if (auditResult) {
            data.auditStatus = "auditSuccessful";
            return data;
          }
        } else if (auditType === "Random") {
          constructedAuditData = [
            {
              field: "Part Number",
              extractedDataa: input?.partNumber,
              dbDataa: auditRun?.partNumber,
              auditCheck:
                input?.partNumber == auditRun?.partNumber ? true : false,
            },
            {
              field: "Quantity",
              extractedDataa: input?.quantity,
              dbDataa: auditRun?.quantity,
              auditCheck: input?.quantity === auditRun?.quantity ? true : false,
            },
          ];
          if (input?.lotNumber) {
            constructedAuditData.push({
              field: "Lot Number",
              extractedDataa: input?.lotNumber,
              dbDataa: auditRun?.lotNumber,
              auditCheck:
                input?.lotNumber[0] == auditRun?.lotNumber[0] ? true : false,
            });
          }
          if (input?.manufDate) {
            constructedAuditData.push({
              field: "Manuf Date",
              extractedDataa: new Date(
                convertToMongoDate(input?.manufDate)
              ).toDateString(),
              dbDataa: new Date(auditRun?.manufactureDate).toDateString(),
              auditCheck:
                new Date(convertToMongoDate(input?.manufDate)).getTime() ===
                new Date(auditRun?.manufactureDate).getTime()
                  ? true
                  : false,
            });
          }
          let t = constructedAuditData.filter((item) => item.auditCheck).length;
          let f = constructedAuditData.length - t;

          auditMatchPercentage = (t / (t + f)) * 100;
          if (Number(auditMatchPercentage) === 100) {
            let auditResult = await db.stock.findOneAndUpdate(
              { uniqueId: input.auditUUID },
              { auditStatus: "successful" }
            );
            if (auditResult) {
              data.auditStatus = "auditSuccessful";
              return data;
            }
          }
        } else {
          await db.stock.findOneAndUpdate(
            { uniqueId: input.auditUUID },
            { auditStatus: "failed" }
          );
          sendStatus.status = "auditFailed";
          return {
            sendStatus,
            auditRun,
            constructedAuditData,
            auditMatchPercentage,
          };
        }
      }
    }
  } else {
    return {
      data: `${input.auditUUID}`,
      statusCode: 404,
      message:
        auditRun?.entryPreferences !== "manual"
          ? `${input.auditUUID} Cannot be Audit`
          : `${input.auditUUID} Not Found`,
    };
  }
}
