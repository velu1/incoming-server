import {
  CreateInterface,
  UploadRecord,
  FindIdInterface,
  UpdateByIDsInterface,
} from "../../interface/incoming/invoiceData";
import { getDB } from "../dbInstance";
export interface SearchCriteria {
  [key: string]: any;
}

export interface Sort {
  [key: string]: 1 | -1;
}
export const create = async (
  input: CreateInterface,
  mongoConnString: string
) => {
  try {
const db = await getDB(mongoConnString);
    const masterData = await db.masterdata
      .find({ isDeleted: false })
      .sort({ createdAt: -1 });

    // Create a set of all valid part numbers for fast lookup
    const validPartNumbers = new Set(masterData.map((m: any) => m.partNumber));
    // Check for unmatched part numbers (works for both upload & single)
    const unmatchedParts: string[] = [];
    if (input.type === "upload" && input.uploadData) {
      // Validate and collect unmatched parts
      for (const item of input.uploadData) {
        if (!validPartNumbers.has(item.partNumber)) {
          unmatchedParts.push(item.partNumber);
        }
      }
      if (unmatchedParts.length > 0) {
        return {
          data: {
            message: "Part numbers not found in master data.",
            unmatchedPartNumbers: unmatchedParts,
          },
          status: false,
        };
      }

      // Proceed with de-duplicating & saving upload data
      let newUpload: UploadRecord[] = [];
      for (const item of input.uploadData) {
        let index = newUpload.findIndex(
          (p) =>
            p.receiptNumber === item.receiptNumber &&
            p.partNumber === item.partNumber
        );
        if (index >= 0) {
          newUpload[index].receiptQuantity += item.receiptQuantity;
        } else {
          newUpload.push({ ...item });
        }
      }

      for (const record of newUpload) {
        const transactionData = {
          receiptNumber: record.receiptNumber,
          partNumber: record.partNumber,
          receiptQuantity: record.receiptQuantity,
          dateOfReceipt: record.dateOfReceipt,
        };

        const existingRecord = await db.InvoiceData.findOne(
          {
            receiptNumber: record.receiptNumber,
            receiptQuantity: record.receiptQuantity,
            partNumber: record.partNumber,
            isDeleted: false,
          },
          { sort: { updatedAt: -1 } }
        );
        console.log("transactionDatatransactionData", transactionData);
        

        if (existingRecord) {
          await db.InvoiceData.findByIdAndUpdate(existingRecord._id, {
            $set: {
              isDeleted: true,
              expiredDate: new Date(),
            },
          });

          await updateTransactionQuantity(transactionData, mongoConnString);
        } else {
          await db.invoiceTranscation.create(transactionData);
        }

        await db.InvoiceData.create(record);
      }
    } else {
      // Single manual input path
      if (!validPartNumbers.has(input.partNumber)) {
        unmatchedParts.push(input.partNumber);
      }
      console.log("hellooo")

      if (unmatchedParts.length > 0) {
        return {
          data: {
            message: `Part number ${unmatchedParts[0]} not found in master data`,
          },
          status: false,
        };
      }

      const transactionData = {
        receiptNumber: input.receiptNumber,
        partNumber: input.partNumber,
        receiptQuantity: input.receiptQuantity,
        dateOfReceipt: input.dateOfReceipt,
      };

      const existingData = await db.InvoiceData.findOne(
        {
          receiptNumber: input.receiptNumber,
          partNumber: input.partNumber,
          receiptQuantity: input.receiptQuantity,
          isDeleted: false,
        },
        { sort: { updatedAt: -1 } }
      );

      if (existingData) {
        await db.InvoiceData.findByIdAndUpdate(
          existingData._id,
          {
            $set: {
              isActive: false,
              isDeleted: true,
              expiredDate: new Date(),
            },
          },
          { new: true }
        );

        await updateTransactionQuantity(transactionData, mongoConnString);
      } else {
        await db.invoiceTranscation.create(transactionData);
      }

      await db.InvoiceData.create(input);
    }
    console.log("unmatchedPartsunmatchedPartsunmatchedParts", unmatchedParts);

    return { data: "Invoice Data created successfully", status: true };
  } catch (error) {
    console.log(error);
    return { data: {}, status: false };
  }
};


export const getAll = async (mongoConnString: string) => {
  try {
    const db = await getDB(mongoConnString);
    const getAll = await db.InvoiceData.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $lookup: {
          from: "invoicetranscations",
          let: {
            receiptNumber: { $toString: "$receiptNumber" },
            partNumber: { $toString: "$partNumber" },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [{ $toString: "$receiptNumber" }, "$$receiptNumber"],
                    },
                    { $eq: [{ $toString: "$partNumber" }, "$$partNumber"] },
                  ],
                },
              },
            },
            {
              $sort: { updatedAt: -1 },
            },
            {
              $limit: 1,
            },
            {
              $project: { inwardQty: 1, _id: 0 },
            },
          ],
          as: "inwardDetails",
        },
      },
      {
        $addFields: {
          inwardQty: {
            $ifNull: [{ $arrayElemAt: ["$inwardDetails.inwardQty", 0] }, 0],
          },
          id: "$_id", // Move id assignment to $addFields
        },
      },
      {
        $project: {
          inwardDetails: 0,
          _id: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return { data: getAll, status: true };
  } catch (error) {
    return { data: [], status: false, error };
  }
};

export const getInvoicePallet = async (mongoConnString: string) => {
  try {
    const db = await getDB(mongoConnString);
    const result = await db.invoiceTranscation.aggregate([
      // Step 1: Only where inwardQty < receiptQuantity
      {
        $match: {
          $expr: { $lt: ["$inwardQty", "$receiptQuantity"] },
        },
      },
      // Step 2: Join with invoiceData, filtering for isDeleted: false
      {
        $lookup: {
          from: "invoicedatas",
          let: { rn: "$receiptNumber" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$receiptNumber", "$$rn"] },
                isDeleted: false,
              },
            },
          ],
          as: "invoiceMatch",
        },
      },
      // Step 3: Keep only those that have a match
      {
        $match: {
          invoiceMatch: { $ne: [] },
        },
      },
      // Step 4: Sort
      {
        $sort: { createdAt: -1 },
      },
      // Step 5: Group by receiptNumber
      {
        $group: {
          _id: "$receiptNumber",
          receiptQuantity: { $first: "$receiptQuantity" },
          inwardQty: { $first: "$inwardQty" },
        },
      },
      // Step 6: Create final structure
      {
        $group: {
          _id: null,
          invoiceNumbers: {
            $addToSet: {
              id: "$_id",
              name: "$_id",
              receiptQuantity: "$receiptQuantity",
              inwardQty: "$inwardQty",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          invoiceNumbers: 1,
        },
      },
    ]);
    return { data: result, status: true };
  } catch (error) {
    return { status: false, error: (error as Error).message };
  }
};

export const getDataByInvoiceAndPallet = async (
  receiptNumber: any,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    const result = await db.invoiceTranscation.aggregate([
      {
        $match: {
          receiptNumber: receiptNumber,
        },
      },
      {
        $addFields: {
          icr: {
            $cond: {
              if: { $eq: ["$receiptQuantity", 0] },
              then: "0%",
              else: {
                $concat: [
                  {
                    $toString: {
                      $multiply: [
                        { $divide: ["$inwardQty", "$receiptQuantity"] },
                        100,
                      ],
                    },
                  },
                  "%",
                ],
              },
            },
          },
        },
      },
    ]);

    return { data: result };
  } catch (error) {
    console.log(error);
  }
};

export const getAllInvoicePalletData = async (
  searchCriteria: SearchCriteria,
  sort: Sort,
  page: number,
  pageSize: number,
  download: boolean,
  invoiceNo: string,
  mongoConnString: string
): Promise<{ data?: any; status: boolean; error?: string; count: number }> => {
  try {
    const db = await getDB(mongoConnString);
    let result: any[] = [];
    let totalCount = 0;

    const convertedSort: Record<string, 1 | -1> = {};
    Object.entries(sort || {}).forEach(([key, value]) => {
      const dir = String(value).toLowerCase();
      convertedSort[key] = dir === "asc" ? 1 : -1;
    });

    if (download) {
      const pipeline: any[] = [
        {
          $match: {
            ...searchCriteria,
            receiptNumber: invoiceNo,
          },
        },
        {
          $addFields: {
            icr: {
              $cond: {
                if: { $eq: ["$receiptQuantity", 0] },
                then: "0%",
                else: {
                  $concat: [
                    {
                      $toString: {
                        $round: [
                          {
                            $multiply: [
                              { $divide: ["$inwardQty", "$receiptQuantity"] },
                              100,
                            ],
                          },
                          1,
                        ],
                      },
                    },
                    "%",
                  ],
                },
              },
            },
          },
        },
        {
          $sort: Object.keys(convertedSort).length
            ? convertedSort
            : { createdAt: -1 },
        },
      ];

      result = await db.invoiceTranscation.aggregate(pipeline);
      totalCount = result.length;
    } else {
      result = await db.invoiceTranscation
        .find({ ...searchCriteria, receiptNumber: invoiceNo })
        .sort(
          Object.keys(convertedSort).length ? convertedSort : { createdAt: -1 }
        )
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec();

      totalCount = await db.invoiceTranscation.countDocuments({
        ...searchCriteria,
        receiptNumber: invoiceNo,
      });
    }
    return { data: result, status: true, count: totalCount };
  } catch (error) {
    return {
      error: (error as Error).message,
      status: false,
      count: 0,
    };
  }
};

export async function getByID(input: FindIdInterface, mongoConnString: string) {
  try {
    const db = await getDB(mongoConnString);
    const getByID = await db.InvoiceData.findById(input);
    return { data: getByID, status: true };
  } catch (error) {
    return { data: error, status: false };
  }
}

export async function UpdateByID(
  input: UpdateByIDsInterface,
  mongoConnString: string
) {
  try {
    const db = await getDB(mongoConnString);
    const updateByID = await db.InvoiceData.findByIdAndUpdate(input.id, input, {
      new: true,
    });
    return { data: updateByID, status: true };
  } catch (error) {
    return { data: error, status: false };
  }
}

export async function deleteByID(
  input: FindIdInterface,
  mongoConnString: string
) {
  try {
    const db = await getDB(mongoConnString);

    // Step 1: Find the document first
    const doc = await db.InvoiceData.findById(input);
    if (!doc) {
      return { data: "Invoice not found", status: false };
    }

    // Step 2: Check status
    if (doc.status !== "Open") {
      return {
        data: `Invoice cannot be deleted because status is ${doc.status}`,
        status: false,
      };
    }

    // Step 3: Perform soft delete
    const deleted = await db.InvoiceData.findByIdAndUpdate(
      input,
      { $set: { isDeleted: true } },
      { new: true }
    );
    
   await db.invoiceTranscation.deleteMany({
      receiptNumber: doc.receiptNumber
    });

    return { data: deleted, status: true };
  } catch (error) {
   
    
    return {
      data: error instanceof Error ? error.message : error,
      status: false,
    };
  }
}

// const updateTransactionQuantity = async (
//   invoiceData: any,
//   mongoConnString: string
// ) => {
//   const db = await getDB(mongoConnString);
//   const existingTransaction = await db.invoiceTranscation.findOne({
//     receiptNumber: invoiceData.receiptNumber,
//     internalPartNo: invoiceData.internalPartNo,
//     partNumber: invoiceData.partNumber,
//   });

//   if (
//     existingTransaction &&
//     existingTransaction.receiptQuantity !== invoiceData.receiptQuantity
//   ) {
//     await db.invoiceTranscation.findByIdAndUpdate(
//       existingTransaction._id,
//       {
//         $inc: { receiptQuantity: invoiceData.receiptQuantity },
//       },
//       { new: true }
//     );
//   }
// };

const updateTransactionQuantity = async (
  invoiceData: any,
  mongoConnString: string
) => {
  const db = await getDB(mongoConnString);
  const existingTransaction = await db.invoiceTranscation.findOne({
    receiptNumber: invoiceData.receiptNumber,
    partNumber: invoiceData.partNumber,
  });

  if (!existingTransaction) {
    // create a new transaction if none exists
    await db.invoiceTranscation.create({
      ...invoiceData,
      inwardQty: invoiceData.receiptQuantity,
    });
    return;
  }

  // calculate new inward quantity
  // const newInwardQty =
  //   (existingTransaction.inwardQty || 0) + invoiceData.receiptQuantity;
    const newInwardQty = existingTransaction.inwardQty;


  // compute ICR (Inward Completion Ratio)
  const icr = (newInwardQty / existingTransaction.receiptQuantity) * 100;

  if (newInwardQty >= existingTransaction.receiptQuantity) {
    // Prevent over-scanning once inward qty equals or exceeds invoice qty
    await db.invoiceTranscation.findByIdAndUpdate(existingTransaction._id, {
      $set: {
        inwardQty: existingTransaction.receiptQuantity,
        icr: "100%",
        isCompleted: true, // mark transaction as completed
        completedAt: new Date(),
      },
    });

    return {
      status: false,
      message: "Inward quantity reached invoice quantity. Scanning disabled.",
    };
  }

  // otherwise update as usual
  await db.invoiceTranscation.findByIdAndUpdate(existingTransaction._id, {
    $set: {
      inwardQty: newInwardQty,
      icr: `${icr.toFixed(1)}%`,
      isCompleted: false,
    },
  });

  return { status: true };
};


export const getAllInvoiceData = async (
  searchCriteria: SearchCriteria,
  sort: Sort,
  page: number,
  pageSize: number,
  download: boolean,
  mongoConnString: string
): Promise<{ data?: any; status: boolean; error?: string; count: number }> => {
  try {
    const db = await getDB(mongoConnString);
    const matchStage = {
      $match: {
        ...searchCriteria,
        isDeleted: false,
      },
    };

    const lookupStage = {
      $lookup: {
        from: "invoicetranscations",
        let: {
          receiptNumber: { $toString: "$receiptNumber" },
          partNumber: { $toString: "$partNumber" },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: [{ $toString: "$receiptNumber" }, "$$receiptNumber"] },
                  { $eq: [{ $toString: "$partNumber" }, "$$partNumber"] },
                ],
              },
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
          { $project: { inwardQty: 1, _id: 0 } },
        ],
        as: "inwardDetails",
      },
    };

    const addFieldsStage = {
      $addFields: {
        inwardQty: {
          $ifNull: [{ $arrayElemAt: ["$inwardDetails.inwardQty", 0] }, 0],
        },
        id: "$_id",
      },
    };

    const projectStage = {
      $project: {
        inwardDetails: 0,
        _id: 0,
      },
    };
    const convertedSort: Record<string, 1 | -1> = {};

    if (!download) {
      Object.entries(sort).forEach(([key, value]) => {
        const direction = String(value).toLowerCase();
        convertedSort[key] = direction === "asc" ? 1 : -1;
      });
    }

    const sortStage = {
      $sort: download ? { createdAt: -1 } : convertedSort,
    };

    const pipeline: any[] = [
      matchStage,
      lookupStage,
      addFieldsStage,
      projectStage,
      sortStage,
    ];

    // Add pagination only if not downloading
    if (!download) {
      pipeline.push({ $skip: (page - 1) * pageSize }, { $limit: pageSize });
    }

    const result = await db.InvoiceData.aggregate(pipeline);

    // Total count for pagination (always needed)
    const totalCount = await db.InvoiceData.countDocuments({
      ...searchCriteria,
      isDeleted: false,
    });

    return { data: result, status: true, count: totalCount };
  } catch (error) {
    return { error: (error as Error).message, status: false, count: 0 };
  }
};
