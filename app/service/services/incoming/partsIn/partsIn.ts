import {
  PartsInStockInterface,
  partsInListUpdateInterface,
} from "../../../interface/incoming/partsIn";
import { getDB } from "../../dbInstance";
import { create } from "../masterData";
import { imageStore } from "./capture";
import {
  FormattedStockData,
  ValidateInoviceTranscation,
  addStockPartsHistory,
  generateUniqueId,
  getCompanyPrefix,
  getManufacturerByPartNumber,
  partsInInc,
  updateInoviceTranscation,
} from "./services/partsIn";

interface MasterData {
  partNumber: string;
  partLocation: string;
  internalPartNo: string;
  description?: string;
  manufacturer?: string;
  type: string;
}

// export async function CreatePartStock(
//   input: PartsInStockInterface,
//   user: any,
//   mongoConnString: string
// ) {
//   try {
//     let manufacturerID = await getManufacturerByPartNumber(
//       input.partNumber,
//       mongoConnString
//     );
//     const isInvoicePresent = await invoicePresent(mongoConnString);
//     if (input?.multipleSticker && isInvoicePresent.invoice) {
//       let checking = await ValidateInoviceTranscation(input, mongoConnString);

//       if (!checking.status) {
//         return {
//           data: checking.message,
//           status: false,
//         };
//       }
//     }

//     if (input.partNumber) {
//       let reqData: MasterData = {
//         partNumber: input.partNumber,
//         internalPartNo: input.internalPartNo,
//         manufacturer: input.manufacturer ? input.manufacturer : "-",
//         partLocation: input.partLocation ? input.partLocation : "-",
//         type: "partsIn",
//       };
//       input.partLocation = input.partLocation ? input.partLocation : "-";
//       //master data
//       if (!manufacturerID) {
//         let queryResult = await create(reqData, mongoConnString);
//         if (!queryResult) {
//           return {
//             message: "Error in creating Master Data",
//             status: false,
//           };
//         }
//       }
//     }
//     //master data create ends

//     //creating Stock of Incoming
//     if (manufacturerID?.internalPartNo) {
//       input.partLocation = manufacturerID.partLocation
//         ? manufacturerID.partLocation
//         : "-";
//       input.internalPartNo = manufacturerID.internalPartNo;
//     }

//     let formattedStockDataArray: FormattedStockData[] = [];
//     let generateMultipleSticker = input.multipleSticker || 1;

//     let generateUniqueData = await generateUniqueId(mongoConnString);
//     let companyPrefix: any = await getCompanyPrefix(mongoConnString);
//     let initialIncrementId = generateUniqueData.incrementId;

//     for (let i = 0; i < generateMultipleSticker; i++) {
//       let uniqIdData: number | string =
//         i >= 1
//           ? (
//               Number(
//                 formattedStockDataArray[i - 1]?.incrementId ??
//                   initialIncrementId
//               ) + 1
//             ).toString()
//           : initialIncrementId;

//       let uniqueId =
//         i >= 1
//           ? companyPrefix.partsInNamingSeries + uniqIdData
//           : generateUniqueData.uniqueId;
//       let imageExtract: any = null;
//       if (companyPrefix?.imageStore && input.image_base64) {
//         imageExtract = await imageStore(
//           input.image_base64,
//           uniqueId.toString(),
//           mongoConnString
//         );
//       }

//       const formattedStockData: any = {
//         ...input,
//         uniqueId: uniqueId.toString(),
//         incrementId: uniqIdData,
//         extracted_sticker: imageExtract ? imageExtract.id : null,
//       };

//       formattedStockDataArray.push(formattedStockData);
//     }
//     let queryResult = await addStockPartsHistory(
//       mongoConnString,
//       formattedStockDataArray,
//       user
//     );

//     await partsInInc(
//       formattedStockDataArray[formattedStockDataArray.length - 1]?.incrementId,
//       mongoConnString
//     );
//     if (isInvoicePresent.invoice) {
//       let transation = {
//         receiptNumber: input.receiptNumber,
//         internalPartNo: input.internalPartNo,
//         partNumber: input.partNumber,
//         quantity: input.quantity * (input.multipleSticker || 1),
//       };
//       await updateInoviceTranscation(transation, mongoConnString);
//     }
//     return {
//       message: queryResult
//         ? "Stock created successfully!"
//         : "Error in creating stock, Add part unique Id in 'Parts-In' configuration.",
//       data: queryResult,
//       status: queryResult ? 200 : 500,
//     };
//   } catch (error) {
//     return {
//       message: "An error occurred",
//       error: error,
//       status: 500,
//     };
//   }
// }

// export const invoicePresent = async (mongoConnString: string) => {
//   const db = await getDB(mongoConnString);
//   const result = await db.printerConfigs
//     .findOne({ type: "partsInPrinterConfig" })
//     .select("invoice");
//   return result;
// };

// export async function CreatePartStock(
//   input: PartsInStockInterface,
//   user: any,
//   mongoConnString: string
// ) {
//   try {
//     const db = await getDB(mongoConnString);

//     //  Fetch master data and create set of valid part numbers
//     const masterData = await db.masterdata
//       .find({ isDeleted: false })
//       .sort({ createdAt: -1 });


//     const validPartNumbers = new Set(masterData.map((m: any) => m.partNumber));
    
    
//     const unmatchedParts: string[] = [];

//     // Check if part number exists in master data
//     if (!validPartNumbers.has(input.partNumber)) {
//       unmatchedParts.push(input.partNumber);
       
//       return {
//         message: `Part number '${input.partNumber}' not found in master data`,
//         status: false,
//         unmatchedPartNumbers: unmatchedParts,
//       };
      
//     }
  


//     //  Continue rest of your existing logic
//     let manufacturerID = await getManufacturerByPartNumber(
//       input.partNumber,
//       mongoConnString
//     );

//     const isInvoicePresent = await invoicePresent(mongoConnString);

//     if (!validPartNumbers.has(input.partNumber)) {
//   return {
//     message: isInvoicePresent.invoice
//       ? "Part number not associated with invoice."
//       : `Part number '${input.partNumber}' not found in master data`,
//     status: false,
//   };
// }


//     if (input?.multipleSticker && isInvoicePresent.invoice) {
//       let checking = await ValidateInoviceTranscation(input, mongoConnString);
//       if (!checking.status) {
//         return {
//           data: checking.message,
//           status: false,
//         };
//       }
//     }

//     if (input.partNumber) {
//       let reqData: MasterData = {
//         partNumber: input.partNumber,
//         internalPartNo: input.internalPartNo,
//         manufacturer: input.manufacturer ? input.manufacturer : "-",
//         partLocation: input.partLocation ? input.partLocation : "-",
//         type: "partsIn",
//       };
//       input.partLocation = input.partLocation ? input.partLocation : "-";

//       if (!manufacturerID) {
//         let queryResult = await create(reqData, mongoConnString);
//         if (!queryResult) {
//           return {
//             message: "Error in creating Master Data",
//             status: false,
//           };
//         }
//       }
//     }

//     //  Continue creating stock data...
//     if (manufacturerID?.internalPartNo) {
//       input.partLocation = manufacturerID.partLocation
//         ? manufacturerID.partLocation
//         : "-";
//       input.internalPartNo = manufacturerID.internalPartNo;
//     }

//     let formattedStockDataArray: FormattedStockData[] = [];
//     let generateMultipleSticker = input.multipleSticker || 1;

//     let generateUniqueData = await generateUniqueId(mongoConnString);
//     let companyPrefix: any = await getCompanyPrefix(mongoConnString);
//     let initialIncrementId = generateUniqueData.incrementId;

//     for (let i = 0; i < generateMultipleSticker; i++) {
//       let uniqIdData: number | string =
//         i >= 1
//           ? (
//               Number(
//                 formattedStockDataArray[i - 1]?.incrementId ?? initialIncrementId
//               ) + 1
//             ).toString()
//           : initialIncrementId;

//       let uniqueId =
//         i >= 1
//           ? companyPrefix.partsInNamingSeries + uniqIdData
//           : generateUniqueData.uniqueId;

//       let imageExtract: any = null;
//       if (companyPrefix?.imageStore && input.image_base64) {
//         imageExtract = await imageStore(
//           input.image_base64,
//           uniqueId.toString(),
//           mongoConnString
//         );
//       }

//       const formattedStockData: any = {
//         ...input,
//         uniqueId: uniqueId.toString(),
//         incrementId: uniqIdData,
//         extracted_sticker: imageExtract ? imageExtract.id : null,
//       };

//       formattedStockDataArray.push(formattedStockData);
//     }

//     let queryResult = await addStockPartsHistory(
//       mongoConnString,
//       formattedStockDataArray,
//       user
//     );

//     await partsInInc(
//       formattedStockDataArray[formattedStockDataArray.length - 1]?.incrementId,
//       mongoConnString
//     );

//     if (isInvoicePresent.invoice) {
//       let transation = {
//         receiptNumber: input.receiptNumber,
//         internalPartNo: input.internalPartNo,
//         partNumber: input.partNumber,
//         quantity: input.quantity * (input.multipleSticker || 1),
//       };
//       await updateInoviceTranscation(transation, mongoConnString);
//     }

//     return {
//       message: queryResult
//         ? "Stock created successfully!"
//         : "Error in creating stock, Add part unique Id in 'Parts-In' configuration.",
//       data: queryResult,
//       status: queryResult ? 200 : 500,
//     };
//   } catch (error) {
//     return {
//       message: "An error occurred",
//       error: error,
//       status: 500,
//     };
//   }
// }
export async function CreatePartStock(
  input: PartsInStockInterface,
  user: any,
  mongoConnString: string
) {
  try {
    const db = await getDB(mongoConnString);

    // ✅ Fetch master data and create set of valid part numbers
    const masterData = await db.masterdata
      .find({ isDeleted: false })
      .sort({ createdAt: -1 });

    const validPartNumbers = new Set(masterData.map((m: any) => m.partNumber));
    
    
    const unmatchedParts: string[] = [];

    //✅ Check if part number exists in master data
    if (!validPartNumbers.has(input.partNumber)) {
      unmatchedParts.push(input.partNumber);
       
      return {
        message: `Part number '${input.partNumber}' not found in master data`,
        status: false,
        unmatchedPartNumbers: unmatchedParts,
      };
      
    }
  


    // ✅ Continue rest of your existing logic
    let manufacturerID = await getManufacturerByPartNumber(
      input.partNumber,
      mongoConnString
    );

    const isInvoicePresent = await invoicePresent(mongoConnString);

    if (!validPartNumbers.has(input.partNumber)) {
  return {
    message: isInvoicePresent.invoice
      ? "Part number not associated with invoice."
      : `Part number '${input.partNumber}' not found in master data`,
    status: false,
  };
}


    if (input?.multipleSticker && isInvoicePresent.invoice) {
      let checking = await ValidateInoviceTranscation(input, mongoConnString);
      if (!checking.status) {
        return {
          data: checking.message,
          status: false,
        };
      }
    }

    if (input.partNumber) {
      let reqData: MasterData = {
        partNumber: input.partNumber,
        internalPartNo: input.internalPartNo,
        manufacturer: input.manufacturer ? input.manufacturer : "-",
        partLocation: input.partLocation ? input.partLocation : "-",
        type: "partsIn",
      };
      input.partLocation = input.partLocation ? input.partLocation : "-";

      if (!manufacturerID) {
        let queryResult = await create(reqData, mongoConnString);
        if (!queryResult) {
          return {
            message: "Error in creating Master Data",
            status: false,
          };
        }
      }
    }

    // ✅ Continue creating stock data...
    if (manufacturerID?.internalPartNo) {
      input.partLocation = manufacturerID.partLocation
        ? manufacturerID.partLocation
        : "-";
      input.internalPartNo = manufacturerID.internalPartNo;
    }

    let formattedStockDataArray: FormattedStockData[] = [];
    let generateMultipleSticker = input.multipleSticker || 1;

    let generateUniqueData = await generateUniqueId(mongoConnString);
    let companyPrefix: any = await getCompanyPrefix(mongoConnString);
    let initialIncrementId = generateUniqueData.incrementId;

    for (let i = 0; i < generateMultipleSticker; i++) {
      let uniqIdData: number | string =
        i >= 1
          ? (
              Number(
                formattedStockDataArray[i - 1]?.incrementId ?? initialIncrementId
              ) + 1
            ).toString()
          : initialIncrementId;

      let uniqueId =
        i >= 1
          ? companyPrefix.partsInNamingSeries + uniqIdData
          : generateUniqueData.uniqueId;

      let imageExtract: any = null;
      if (companyPrefix?.imageStore && input.image_base64) {
        imageExtract = await imageStore(
          input.image_base64,
          uniqueId.toString(),
          mongoConnString
        );
      }

      const formattedStockData: any = {
        ...input,
        uniqueId: uniqueId.toString(),
        incrementId: uniqIdData,
        extracted_sticker: imageExtract ? imageExtract.id : null,
      };

      formattedStockDataArray.push(formattedStockData);
    }

    let queryResult = await addStockPartsHistory(
      mongoConnString,
      formattedStockDataArray,
      user
    );

    await partsInInc(
      formattedStockDataArray[formattedStockDataArray.length - 1]?.incrementId,
      mongoConnString
    );

    if (isInvoicePresent.invoice) {
      let transation = {
        receiptNumber: input.receiptNumber,
        // palletNumber: input.palletNumber,
        internalPartNo: input.internalPartNo,
        partNumber: input.partNumber,
        quantity: input.quantity * (input.multipleSticker || 1),
      };
      await updateInoviceTranscation(transation, mongoConnString);
    }

    return {
      message: queryResult
        ? "Stock created successfully!"
        : "Error in creating stock, Add part unique Id in 'Parts-In' configuration.",
      data: queryResult,
      status: queryResult ? 200 : 500,
    };
  } catch (error) {
    console.log("errrrrrrrrrr", error);
    return {
      message: "An error occurred",
      error: error,
      status: 500,
    };
  }
}


export const invoicePresent = async (mongoConnString: string) => {
  const db = await getDB(mongoConnString);
  const result = await db.printerConfigs
    .findOne({ type: "partsInPrinterConfig" })
    .select("invoice");
  return result;
};

//Master Data and Invoice Data
export const getPartsList = async (
  input: partsInListUpdateInterface,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    const getByUniqueID = await db.stock.findOne({ uniqueId: input });

    return { data: getByUniqueID, status: true };
  } catch (error) {
    return { data: error, status: false };
  }
};

export const updateByIDPartsList = async (
  id: string,
  input: partsInListUpdateInterface,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    let updateByID;
    if (!input.status) {
      updateByID = await db.stock.findByIdAndUpdate(id, input, {
        new: true,
      });
    } else if (input.isReturn === true && input.status === "returned") {
      updateByID = await db.stock.findByIdAndUpdate(
        id,
        input,
        { isReturn: true },
        { status: "returned" },
        {
          new: true,
        }
      );
      if (updateByID) {
        return { message: "Parts returned successfully", status: true };
      }
    } else if (input.status === "scraped") {
      updateByID = await db.stock.findByIdAndUpdate(
        id,
        { status: "scraped" },
        {
          new: true,
        }
      );
      if (updateByID) {
        return { message: "Parts scraped successfully", status: true };
      }
    }
    if (updateByID) {
      return { data: updateByID, status: true };
    } else {
      return {
        message: "No document found with the provided ID",
        status: false,
      };
    }
  } catch (error) {
    return { data: error, status: false };
  }
};
