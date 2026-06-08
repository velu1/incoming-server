import {
  CreateInterface,
  FindIdInterface,
  UpdateByIDsInterface,
} from "../../interface/incoming/masterData";
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
    interface UploadRecord {
      partNumber: string;
    }
    if (input.type === "upload") {
      const uploadData: UploadRecord[] = input.uploadData || [];

      for (const record of uploadData) {
        const existingRecord = await db.masterdata.findOne(
          {
            partNumber: record.partNumber,
            isDeleted: false,
          },
          { sort: { updatedAt: -1 } }
        );
        if (existingRecord) {
          await db.masterdata.findByIdAndUpdate(
            existingRecord._id,
            {
              $set: {
                isDeleted: true,
                expiredDate: new Date(),
              },
            },
            { new: true }
          );
        }
        await db.masterdata.create(record);
      }
    } else {
      const existingData = await db.masterdata.findOne(
        {
          partNumber: input.partNumber,
          isDeleted: false,
        },
        { sort: { updatedAt: -1 } }
      );
      if (existingData) {
        await db.masterdata.findByIdAndUpdate(
          existingData._id,
          {
            $set: {
              isDeleted: true,
              expiredDate: new Date(),
            },
          },
          { new: true }
        );
      }
      await db.masterdata.create(input);
    }
    return { data: input, status: true };
  } catch (error) {
    console.log(error);
  }
};
export async function getByID(input: FindIdInterface, mongoConnString: string) {
  try {
    const db = await getDB(mongoConnString);
    const getByID = await db.masterdata.findById(input);
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
    const updateByID = await db.masterdata.findByIdAndUpdate(input.id, input, {
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
    const deleted = await db.masterdata.findByIdAndUpdate(input, {
      $set: { isDeleted: true },
      new: true,
    });
    return { data: deleted, status: true };
  } catch (error) {
    return { data: error, status: false };
  }
}

export const getAllMasterData = async (
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
      result = await db.masterdata
        .find({ ...searchCriteria, isDeleted: false })
        .sort({ createdAt: -1 });
    } else {
      result = await db.masterdata
        .find({ ...searchCriteria, isDeleted: false })
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize);
    }
    totalCount = await db.masterdata.countDocuments({
      ...searchCriteria,
      isDeleted: false,
    });
    return { data: result, status: true, count: totalCount };
  } catch (error) {
    return { error: (error as Error).message, status: false, count: 0 };
  }
};
