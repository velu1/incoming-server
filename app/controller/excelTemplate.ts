import { Request, Response } from "express";
import { service } from "../service/app";
import { ResponseInterface } from "../interface/response.interface";
const logger = require("../utils/logger");

exports.create = async (req: Request, res: Response) => {
  logger.info(`${req.headers["x-tenant-code"]} - Created  template`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const createData: ResponseInterface =
      await service.excelTemplate.CreateDataTemplate(req.body, mongoConnString);
    return res.status(createData.status ? 200 : 500).send({
      data: createData.data,
    });
  } catch (error) {
    logger.error(
      `${req.headers["x-tenant-code"]} - Failed to create template`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request.2",
      detail: error,
    });
  }
};

exports.getByType = async (req: Request, res: Response) => {
  try {
    logger.info(`${req.headers["x-tenant-code"]} - Get all Templates`);
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const getData: ResponseInterface =
      await service.excelTemplate.getDataTemplate(
        req.params.type,
        mongoConnString
      );
    return res.status(200).send({
      data: getData,
      message: "Data validation correct",
    });
  } catch (error) {
    logger.error(
      `${req.headers["x-tenant-code"]} - Failed to get template by type`,
      { error: error }
    );
    return res.status(500).send({
      message: "Data validation fail",
    });
  }
};

exports.deleteByIdTemplate = async (req: Request, res: Response) => {
  logger.info(`${req.headers["x-tenant-code"]} - Delete template by ID`);
  logger.debug(`Request params: ${JSON.stringify(req.params)}`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const deleteTemplateData: ResponseInterface =
      await service.excelTemplate.deleteByID(req.params.id, mongoConnString);
    return res.status(200).send({
      data: deleteTemplateData,
      message: "Data validation correct",
    });
  } catch (error) {
    logger.error(
      `${req.headers["x-tenant-code"]} - Failed to delete template by ID`,
      { error: error }
    );
    return res.status(500).send({
      message: "Data validation fail",
    });
  }
};
