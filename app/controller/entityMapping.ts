import { Request, Response } from "express";
import { service } from "../service/app";
import { ResponseInterface } from "../interface/response.interface";
const loggerEntity = require("../utils/logger");

exports.createInwardTemplate = async (req: Request, res: Response) => {
  loggerEntity.info(`${req.headers["x-tenant-code"]} - Create Inward template`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const createEntityData: ResponseInterface =
      await service.entityMapping.createInwardTemplate(
        req.body,
        mongoConnString
      );
    return res.status(createEntityData.status ? 200 : 500).send({
      data: createEntityData.data
        ? createEntityData.data
        : createEntityData.message,
    });
  } catch (error) {
    loggerEntity.error(
      `${req.headers["x-tenant-code"]} - Failed to create inward template`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request",
      detail: error,
    });
  }
};

exports.getAllInwardTemplates = async (req: Request, res: Response) => {
  loggerEntity.info(
    `${req.headers["x-tenant-code"]} - Get all inward templates`
  );
  loggerEntity.debug(`Request body: ${JSON.stringify(req.body)}`);
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

    const fieldsToSearch = ["templateName", "manufacturer", "partNumber"];

    let searchCriteria: any = {};

    if (searchQuery) {
      searchCriteria.$or = fieldsToSearch.map((field) => ({
        [field]: { $regex: new RegExp(searchQuery, "i") },
      }));
    }
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const queryResult: ResponseInterface =
      await service.entityMapping.getAllInwardTemplates(
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
        message: "Inward templates fetched successfully",
      });
    } else {
      res.status(500).send({
        message: "Some error occurred while fetching Inward remplates data",
        detail: queryResult.error,
      });
    }
  } catch (error) {
    loggerEntity.error(
      `${req.headers["x-tenant-code"]} - Failed to get all inward templates`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request.",
    });
  }
};

// DELETE
exports.deleteInwardTemplate = async (req: Request, res: Response) => {
  loggerEntity.info(`${req.headers["x-tenant-code"]} - Delete inward template`);
  loggerEntity.debug(`Request params: ${JSON.stringify(req.params)}`);
  try {
    if (!req.params.id) {
      res.status(500).send({
        message: "Delete data must include template ID",
      });
    }
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const templateData: ResponseInterface =
      await service.entityMapping.deleteInwardTemplate(
        req.params.id,
        mongoConnString
      );
    if (templateData.status) {
      return res.status(200).send({
        message: "Inward template data deleted successfully",
        data: templateData.data,
      });
    } else {
      let errorMessage =
        "Some error occurred while deleting the Inward template data.";
      return res.status(500).send({
        message: errorMessage,
      });
    }
  } catch (error) {
    loggerEntity.error(
      `${req.headers["x-tenant-code"]} - Failed to delete inward template`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request",
      details: error,
    });
  }
};

//GET All manufacturer
exports.getTemplateManufacturer = async (req: Request, res: Response) => {
  loggerEntity.info(
    `${req.headers["x-tenant-code"]} - get All getTemplateManufacturer`
  );

  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const result: ResponseInterface =
      await service.entityMapping.getTemplateManufacturer(req, mongoConnString);
    res.status(200).send(result);
  } catch (error) {
    loggerEntity.error(
      `${req.headers["x-tenant-code"]} - Failed to get template manufacturer`,
      { error: error }
    );
    res.status(500).send({
      message: "Some error occurred while fetching manufacturer data",
      detail: error,
    });
  }
};

// exports.associateTemplate = async (req: Request, res: Response) => {

//   try {
//     const mongoConnString = req.headers["x-tenant-mongodb-uri"];
//     const result: ResponseInterface =
//       await service.entityMapping.associateTemplate(req.body, mongoConnString);
//     if (result.statusCode == 200) {
//       return res.status(200).send(result.data);
//     } else {
//       return res.status(500).send({ message: result.message });
//     }
//   } catch (error) {

//     return res.status(500).send(error);
//   }
// };

exports.associateTemplate = async (req: Request, res: Response) => {
  loggerEntity.info(`${req.headers["x-tenant-code"]} - Associate template`);
  loggerEntity.debug(`Request body: ${JSON.stringify(req.body)}`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const result = await service.entityMapping.associateTemplate(
      req.body,
      mongoConnString
    );

    if (result.status) {
      return res.status(200).send({ message: result.message });
    } else {
      return res.status(500).send({ message: result.message });
    }
  } catch (error: any) {
    loggerEntity.error(
      `${req.headers["x-tenant-code"]} - Failed to associate template`,
      { error: error }
    );
    return res.status(500).send({ message: error.message });
  }
};
