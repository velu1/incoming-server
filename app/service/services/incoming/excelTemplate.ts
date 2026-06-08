import { getDB } from "../dbInstance";

import {
  CreateInterface,
  FindIDInterface,
  FindTypeInterface,
} from "../../interface/incoming/excelTemplate";

export const CreateDataTemplate = async (
  input: CreateInterface,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    const create = await db.excelTemplate.create(input);
    return { data: create, status: true };
  } catch (error) {
    return { data: error, status: false };
  }
};

export const getDataTemplate = async (
  input: FindTypeInterface,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    const getAll = await db.excelTemplate
      .find({
        type: input,
        isDeleted: false,
      })
      .sort({ createdAt: -1 });
    return { data: getAll, status: true };
  } catch (error) {
    return { data: error, status: false };
  }
};

export async function deleteByID(
  input: FindIDInterface,
  mongoConnString: string
) {
  try {
    const db = await getDB(mongoConnString);
    const deleted = await db.excelTemplate.findByIdAndUpdate(input, {
      $set: { isDeleted: true },
      new: true,
    });
    return { data: deleted, status: true };
  } catch (error) {
    return { data: error, status: false };
  }
}
