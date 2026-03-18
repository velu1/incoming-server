import { Request, Response } from "express";
import {
  Pagination,
  SearchCriteria,
} from "../interface/partHistoryReports.interface";
import { service } from "../service/app";

const logger = require("../utils/logger");

exports.getPartHistoryReport = async (req: Request, res: Response) => {
  logger.info(`${req.headers["x-tenant-code"]} - Fetch part history report`);
  try {
    const {
      page,
      pageSize,
      searchQuery,
      sortColumn,
      sortOrder,
      startDate,
      endDate,
      download,
    }: Pagination = req.body.pagination;

    let sort: { [key: string]: 1 | -1 } = {};
    sort[sortColumn] = sortOrder;

    const fieldsToSearch = [
      "uniqueId",
      "receiptNumber",
      "partNumber",
      "internalPartNo",
      "manufacturer",
    ];

    let searchCriteria: SearchCriteria = {};

    if (searchQuery) {
      searchCriteria.$or = fieldsToSearch.map((field) => ({
        [field]: { $regex: new RegExp(searchQuery, "i") },
      }));
    }

    // Set the start date to 12:00 AM and the end date to 11:59 PM
    const startDateTime = startDate ? new Date(new Date(startDate)) : null;
    const endDateTime = endDate ? new Date(new Date(endDate)) : null;

    if (startDateTime && endDateTime) {
      searchCriteria.createdAt = {
        $gte: startDateTime,
        $lte: endDateTime,
      };
    }

    // Fetch reels data based on the criteria
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];

    const fetchResult = await service.partHistoryReports.fetchReels(
      searchCriteria,
      sort,
      page,
      pageSize,
      download,
      mongoConnString
    );
    if (!fetchResult.status) {
      return res.status(500).send({
        message: "Error occurred while fetching the part history report",
        detail: fetchResult.error,
      });
    }

    return res.status(200).send({
      data: fetchResult.data,
      count: fetchResult.count,
      message: "part history report fetched successfully",
    });
  } catch (error: any) {
    logger.error(
      `${req.headers["x-tenant-code"]} - Failed to get part history report`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request",
      detail: error.message || "Details error",
    });
  }
};
