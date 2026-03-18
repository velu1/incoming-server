import { Request, Response } from "express";
import { service } from "../service/app";
import { ResponseInterface } from "../interface/response.interface";

const loggerEntity = require("../utils/logger");

exports.createTemplateHistory = async (req: Request, res: Response) => {
  loggerEntity.info(
    `${req.headers["x-tenant-code"]} - Create Template Histories`
  );
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];

    const getTemplateHistories: any =
      await service.templatesHistories.createTemplateHistory(
        req.body,
        mongoConnString
      );
    return res
      .status(getTemplateHistories.status ? 200 : 500)
      .send(getTemplateHistories.data);
  } catch (error) {
    loggerEntity.error(
      `${req.headers["x-tenant-code"]} - Failed to create template history`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request.2",
      detail: `${error}`,
    });
  }
};

exports.getTemplateDataHistories = async (req: Request, res: Response) => {
  loggerEntity.info(
    `${req.headers["x-tenant-code"]} - Get template data histories`
  );
  loggerEntity.debug(`Request body: ${JSON.stringify(req.body)}`);
  try {
    const getTemplateHistories: ResponseInterface =
      await service.templatesHistories.getTemplateData(
        JSON.parse(req.body.json_payload)
      );
    return res
      .status(getTemplateHistories.status ? 200 : 500)
      .send(getTemplateHistories.data[0]);
  } catch (error) {
    loggerEntity.error(
      `${req.headers["x-tenant-code"]} - Failed to get template data histories`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request.2",
      detail: `${error}`,
    });
  }
};

exports.deletePartNumber = async (req: Request, res: Response) => {
  loggerEntity.info(`${req.headers["x-tenant-code"]} - Delete part number`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const getTemplateHistories: any =
      await service.templatesHistories.deletePartNumber(
        req.params.id,
        mongoConnString
      );
    return res.status(getTemplateHistories.status ? 200 : 500).send({
      status: "success",
      message: getTemplateHistories?.data?.message,
    });
  } catch (error) {
    loggerEntity.error(
      `${req.headers["x-tenant-code"]} - Failed to delete part number`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform delete part number",
      detail: `${error}`,
    });
  }
};
