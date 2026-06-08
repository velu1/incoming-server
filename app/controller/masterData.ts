import { Request, Response } from "express";
import { service } from "../service/app";
import { ResponseInterface } from "../interface/response.interface";
const masterLogger = require("../utils/logger");

exports.createMaster = async (req: Request, res: Response) => {
  masterLogger.info(`${req.headers["x-tenant-code"]} - Create Master Data`);
  try {
    
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    console.log("mongoConnStringmongoConnString", req.headers);
    const createMasterData: any = await service.masterData.create(
      req.body,
      mongoConnString
    );

    masterLogger.info(
      `${req.headers["x-tenant-code"]} - Master data created successfully`,
      {
        data: createMasterData.data,
      }
    );
    return res.status(createMasterData.status ? 200 : 500).send({
      data: createMasterData.data,
    });
  } catch (error) {
    masterLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Failed to perform request",
      detail: `${error}`,
    });
  }
};

exports.getAllMasterData = async (req: Request, res: Response) => {
  masterLogger.info(`${req.headers["x-tenant-code"]} - Get all master data`);
  masterLogger.debug(`Request body: ${JSON.stringify(req.body)}`);
  try {
    const {
      page,
      pageSize,
      searchQuery,
      sortColumn,
      sortOrder,
      download,
    }: any = req.body.pagination;

    let sort: { [key: string]: 1 | -1 } = {};
    sort[sortColumn] = sortOrder;

    const fieldsToSearch = [
      "partNumber",
      "partLocation",
      "internalPartNo",
      "description",
      "manufacturer",
    ];

    let searchCriteria: any = {};

    if (searchQuery) {
      searchCriteria.$or = fieldsToSearch.map((field) => ({
        [field]: { $regex: new RegExp(searchQuery, "i") },
      }));
    }
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    console.log("mongoConnStringmongoConnString", mongoConnString);

    const queryResult: ResponseInterface =
      await service.masterData.getAllMasterData(
        searchCriteria,
        sort,
        page,
        pageSize,
        download,
        mongoConnString
      );
    if (queryResult.status) {
      return res.status(200).send({
        data: queryResult.data,
        count: queryResult.count,
        message: "Master data fetched successfully",
      });
    } else {
      res.status(500).send({
        message: "Some error occurred while fetching master data",
        detail: queryResult.error,
      });
    }
  } catch (error) {
    masterLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to get all master data`,
      { error: error }
    );
    console.log("Error in fetching master data:", error);
    return res.status(500).send({
      message: "Failed to perform request.",
    });
  }
};

exports.getByIDMaster = async (req: Request, res: Response) => {
  try {
    masterLogger.info(`${req.headers["x-tenant-code"]} - get master by id`);
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const getByIdDataMaster: ResponseInterface =
      await service.masterData.getByID(req.params.id, mongoConnString);
    masterLogger.info(
      `${req.headers["x-tenant-code"]} - fetched Master data by id successfully`,
      {
        data: getByIdDataMaster,
      }
    );
    return res.status(200).send({
      data: getByIdDataMaster,
      message: "Data validation correct",
    });
  } catch (error) {
    masterLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Data validation fail",
    });
  }
};

exports.updatebyIDMaster = async (req: Request, res: Response) => {
  masterLogger.info(`${req.headers["x-tenant-code"]} - Update user`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const updatedMasterData: ResponseInterface =
      await service.masterData.UpdateByID(req.body, mongoConnString);
    masterLogger.info(
      `${req.headers["x-tenant-code"]} - User Updated successfully`,
      {
        data: updatedMasterData.data,
      }
    );
    return res.status(updatedMasterData.status ? 200 : 500).send({
      data: updatedMasterData.data,
      status: updatedMasterData.status ? 200 : 500,
    });
  } catch (error) {
    masterLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Failed to perform request.2",
      data: error,
    });
  }
};

exports.deleteByIdMaster = async (req: Request, res: Response) => {
  try {
    masterLogger.info(`${req.headers["x-tenant-code"]} - delete master`);
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const deleteMasterData: ResponseInterface =
      await service.masterData.deleteByID(req.params.id, mongoConnString);
    console.log(deleteMasterData);

    masterLogger.info(
      `${req.headers["x-tenant-code"]} - master data deleted successfully`,
      {
        data: deleteMasterData,
      }
    );
    return res.status(200).send({
      data: deleteMasterData,
      message: "Data validation correct",
    });
  } catch (error) {
    masterLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Data validation fail",
    });
  }
};
