// import db from "../../models";
import { getDB } from "../dbInstance";

import {
  SearchCriteria,
  Sort,
} from "../../interface/incoming/partHistoryReports";

export const fetchReels = async (
  searchCriteria: SearchCriteria,
  _sort: Sort,
  page: number,
  pageSize: number,
  download: boolean,
  mongoConnString: string
): Promise<{ data?: any; status: boolean; error?: string; count: number }> => {
  try {
    const db = await getDB(mongoConnString);
    if (!db.stock) {
      console.error("db.stocks is not defined");
      return {
        status: false,
        error: "Database model is not defined",
        count: 0,
      };
    }
    let result;
    let totalCount;

    if (download === true) {
      result = await db.stock
        .find(searchCriteria, { extractedSticker: 0, originalData: 0 })
        .select("internalPartNo uniqueId");
      // .sort(sort)
    } else {
      result = await db.stock
        .find(searchCriteria, { extractedSticker: 0, originalData: 0 })
        .select("internalPartNo uniqueId")
        // .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize);
    }
    totalCount = await db.stock.countDocuments(searchCriteria);
    return { data: result, status: true, count: totalCount };
  } catch (error) {
    return { error: (error as Error).message, status: false, count: 0 };
  }
};

module.exports = {
  fetchReels,
};
