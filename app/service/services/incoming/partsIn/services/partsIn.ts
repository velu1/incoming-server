import { MasterInvoiceInterface } from "../../../../interface/incoming/partsIn";
import { IPartsInDetails } from "../../../../interface/partHistory";
import { getDB } from "../../../dbInstance";
import { invoicePresent } from "../capture";

interface Combine {
  partNumber: string;
  manufacturer: string;
  description: string;
  receiptNumber: string;
  internalPartNo: string;
  partLocation: string;
  quantity: number;
  idCode: string;
  dateOfReceipt: string | number;
  customerName: string;
  customerCode: string;
}
interface GetByPartNumberResponse {
  data: Combine | null;
  message?: string;
  status?: boolean;
}
type StockItem = {
  uniqueId: string;
  internalPartNo: string;
  reelId: string;
  partsInDetails: IPartsInDetails;
  status: "PartsIn";
};

export interface FormattedStockData {
  uniqueId?: string;
  manufacturer: string;
  quantity: number;
  lotNumber?: LotData[]; // It's not acceptable
  entryPreferences?: string;
  internalPartNo: string;
  partLocation: string;
  receiptNumber: string;
  manufactureDate?: any;
  partNumber: string; // Remove this field
  incrementId?: number | string;
  dateOfReceipt: string | number;
  idCode: string;
  extractedImage?: string;
  extracted_sticker?: string;
  expireDate?: string;
  description?: string;
  workOrderId?: string;
  productionLine?: string;
  customerCode?: string;
  customerName?: string;
  deliveryChallan?: string;
  partType?: string;
  floor?: string;
  department?: string;
  hsnCode?: string;
  valuationRate?: string;
  partDescription?: string;
}
type LotData = string | number;
export interface SearchCriteria {
  [key: string]: any;
}

export interface Sort {
  [key: string]: 1 | -1;
}

export const getPartsStock = async (mongoConnString: string) => {
  try {
    const db = await getDB(mongoConnString);
    let incomingStock = await db.stock
      .find({ isDeleted: false })
      .sort({ uniqueId: -1 })
      .limit(50);
    return {
      data: incomingStock,
      status: true,
    };
  } catch (error) {
    return {
      data: null,
      status: false,
    };
  }
};

export const updateInoviceTranscation = async (
  data: any,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    const existingTransaction = await db.invoiceTranscation.findOne({
      receiptNumber: data.receiptNumber,
      partNumber: data.partNumber,
    });

    if (!existingTransaction) return null;

    // Update inwardQty and return the updated document
    const updatedTransaction = await db.invoiceTranscation.findByIdAndUpdate(
      existingTransaction._id,
      {
        $inc: {
          inwardQty: Number(data.quantity),
        },
      },
      { new: true }
    );

    if (!updatedTransaction) return null;

    const status =
      updatedTransaction.receiptQuantity === updatedTransaction.inwardQty
        ? "Completed"
        : "In progress";

    // Update the invoiceData collection
    await db.InvoiceData.findOneAndUpdate(
      { receiptNumber: data.receiptNumber, partNumber: data.partNumber },
      { $set: { status } }
    );

    return updatedTransaction;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const ValidateInoviceTranscation = async (
  data: any,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    const existingTransaction = await db.invoiceTranscation.findOne({
      receiptNumber: data?.receiptNumber,
      partNumber: data?.partNumber,
    });

    if (!existingTransaction) {
      return { status: false, message: "Invoice transaction not found" };
    }

    let totalIncomingQty = Number(data.quantity);
    if(data.multipleSticker != 0){
      totalIncomingQty =
        Number(data.quantity) * Number(data.multipleSticker);
      }
    const newInwardQty = existingTransaction.inwardQty + totalIncomingQty;

    if (newInwardQty <= existingTransaction.receiptQuantity) {
      return { status: true };
    } else {
      return { status: false, message: "Quantity exceeds invoice limit" };
    }
  } catch (error) {
    console.log(error);
    return { status: false, message: "Error in fetching invoice transaction" };
  }
};

export async function getByPartNumber(
  mongoConnString: string,
  input: MasterInvoiceInterface
): Promise<GetByPartNumberResponse> {
  try {
    const db = await getDB(mongoConnString);
    const isInvoicePresent = await invoicePresent(mongoConnString);

    let combinedData: Combine[] = [];

    let getMaster = await db.masterdata.find({
      partNumber: input.partNumber,
      isDeleted: false,
    });
    if (isInvoicePresent?.invoice && getMaster && getMaster.length > 0) {
      let getInvoice = await db.InvoiceData.find({
        partNumber: input.partNumber,
        receiptNumber: input.receiptNumber,
        isDeleted: false,
      });

      if (getInvoice && getInvoice.length > 0) {
        if (getMaster[0].partNumber === getInvoice[0].partNumber) {
          combinedData.push({
            partNumber: getMaster[0].partNumber,
            quantity: getMaster[0].quantity,
            description: getMaster[0].description,
            manufacturer: getMaster[0].manufacturer,
            receiptNumber: getInvoice[0].receiptNumber,
            idCode: getMaster[0].idCode,
            internalPartNo: getMaster[0].internalPartNo,
            partLocation: getMaster[0].partLocation,
            dateOfReceipt: getInvoice[0]?.dateOfReceipt,
            customerName: getMaster[0].customerName,
            customerCode: getMaster[0].customerCode,
          });
        }

        return { data: combinedData[0] };
      } else {
        return {
          data: null,
          message: "Invoice Data Not Found",
          status: true,
        };
      }
    } else if (!isInvoicePresent?.invoice) {
      let masterData: any = {
        partNumber: getMaster[0].partNumber,
        quantity: getMaster[0].quantity,
        manufacturer: getMaster[0].manufacturer,
        dateOfReceipt: new Date(),
        idCode: getMaster[0].idCode,
        internalPartNo: getMaster[0].internalPartNo,
        partLocation: getMaster[0].partLocation,
        description: getMaster[0].description,
        customerName: getMaster[0].customerName,
        customerCode: getMaster[0].customerCode,
      };
      return { data: masterData };
    } else {
      return {
        data: null,
        message: "Not found in Master Data",
      };
    }
  } catch (error) {
    return { data: null, status: false };
  }
}

export async function getManufacturerByPartNumber(
  partNumber: string,
  mongoConnString: string
) {
  const db = await getDB(mongoConnString);
  let masterData = await db.masterdata.findOne({
    partNumber: partNumber,
    isDeleted: false,
  });

  return masterData;
}

export async function generateUniqueId(mongoConnString: string) {
  let uniqueId: number | string = 0;
  let prevIncomingStock = await getPrevIncomingStock(mongoConnString);

  if (
    prevIncomingStock &&
    prevIncomingStock.incrementIdParts &&
    prevIncomingStock.incrementIdParts != "NaN"
  ) {
    let uniqueIdLength = prevIncomingStock.incrementIdParts.length;

    uniqueId = (Number(prevIncomingStock.incrementIdParts) + 1)
      .toString()
      .padStart(uniqueIdLength, "0");
  } else {
    let namingSeries: string | Error = await getBarcodeSeries(mongoConnString);
    if (typeof namingSeries === "string") {
      uniqueId = namingSeries;
    } else {
      console.error("Failed to get barcode series:", namingSeries);
    }
  }
  let companyPrefix = await getCompanyPrefix(mongoConnString);
  let incrementId = uniqueId;
  uniqueId = companyPrefix.partsInNamingSeries + uniqueId;
  return {
    uniqueId: uniqueId,
    incrementId: incrementId,
  };
}

export const getCompanyPrefix = async (mongoConnString: string) => {
  try {
    const db = await getDB(mongoConnString);
    const result = await db.printerConfigs
      .findOne({ type: "partsInPrinterConfig" })
      .select("partsInNamingSeries imageStore");
    return result;
  } catch (error) {
    return error;
  }
};

const getBarcodeSeries = async (
  mongoConnString: string
): Promise<string | Error> => {
  try {
    const db = await getDB(mongoConnString);
    const result = await db.printerConfigs.findOne({
      type: "partsInPrinterConfig",
    });

    return result?.namingSeries;
  } catch (error) {
    return error as Error;
  }
};

export const addStockPartsHistory = async (
  mongoConnString: string,
  data: FormattedStockData[],
  user?: any
): Promise<any[] | null> => {
  try {
    const db = await getDB(mongoConnString);
    let stock = await db.stock.insertMany(data);
    return stock;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const partsInInc = async (
  incrementIdParts: number | string | undefined,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    const createUpdateSettings = await db.settingTranscation.findOneAndUpdate(
      {},
      {
        $set: {
          incrementIdParts: incrementIdParts,
        },
      },
      { upsert: true, new: true }
    );

    return createUpdateSettings;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getPrevIncomingStock = async (mongoConnString: string) => {
  try {
    const db = await getDB(mongoConnString);
    const result = await db.settingTranscation
      .findOne({})
      // .select("uniqueId incrementId")
      .sort({ _id: -1 })
      .limit(1);

    return result;
  } catch (error) {
    return error;
  }
};

export const getAllStocks = async (
  searchCriteria: SearchCriteria,
  sort: Sort,
  page: number,
  pageSize: number,
  download: boolean,
  mongoConnString: string
): Promise<{ data?: any; status: boolean; error?: string; count: number }> => {
  try {
    const db = await getDB(mongoConnString);
    let result: any;
    let totalCount: any;
    if (download === true) {
      result = await db.stock
        .find({ ...searchCriteria, isDeleted: false })
        .sort({ createdAt: -1 });
    } else {
      result = await db.stock
        .find({ ...searchCriteria, isDeleted: false })
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize);
    }
    totalCount = await db.stock.countDocuments({
      ...searchCriteria,
      isDeleted: false,
    });
    return { data: result, status: true, count: totalCount };
  } catch (error) {
    return { error: (error as Error).message, status: false, count: 0 };
  }
};
