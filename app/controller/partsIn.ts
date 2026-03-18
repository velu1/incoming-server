import { Request, Response } from "express";
import { service } from "../service/app";
import { ResponseInterface } from "../interface/response.interface";
const partsInLogger = require("../utils/logger");

import { socketSendMessage } from "../socket/index";
import axios from "axios";
const { config } = require("../config/index");

exports.partsValidate = async (req: Request, res: Response) => {
  partsInLogger.info(`${req.headers["x-tenant-code"]} - Create Parts Validate`);

  try {
    let reqData = {
      partNumber: req.params.partNumber,
      receiptNumber: req.params.invoiceNo,
    };
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const getPartsValidate: ResponseInterface =
      await service.partsServices.getByPartNumber(reqData, mongoConnString);
    partsInLogger.info(
      `${req.headers["x-tenant-code"]} - Parts Validation Successful`
    );
    return res.status(200).send(getPartsValidate);
  } catch (error) {
    partsInLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Parts Validate failed",
    });
  }
};

exports.createPartsInStock = async (req: Request, res: Response) => {
  
  partsInLogger.info(
    `${req.headers["x-tenant-code"]} - Creating a Incoming Stock`
  );
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const userId: any = req.headers["x-user-id"];
    const CreatePartsStock: ResponseInterface =
      await service.partsIn.CreatePartStock(req.body, userId, mongoConnString);
    const getPartsStock = await service.partsServices.getPartsStock(
      mongoConnString
    );
    await socketSendMessage("DATA/INCOMING-MANUAL", getPartsStock.data);

    if (CreatePartsStock.status) {
      partsInLogger.info(
        `${req.headers["x-tenant-code"]} - Incoming Stock created successfully`,
        {
          data: req.body,
        }
      );

      if (CreatePartsStock.statusCode === 400) {
        return res.status(400).send(CreatePartsStock.data);
      } else {
        return res.status(200).send(CreatePartsStock);
      }
    } else {
      return res.status(500).send(CreatePartsStock);
    }
  } catch (error) {
    partsInLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Parts Validate failed",
    });
  }
};


exports.createCaptureStock = async (req: Request, res: Response) => {

    console.log("hiiiiiiiiiiiiiiiiiiiiiiii");
 
  partsInLogger.info(
    `${req.headers["x-tenant-code"]} - Creating a Capture Incoming Stock`
  );

  try {
    const userId: any = req.headers["x-user-id"];
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const code = req.headers["x-tenant-code"];

    const CreateCaptureStock: ResponseInterface =
      await service.camera.CreateCaptureStock(
        req.body,
        userId,
        mongoConnString,
        code
      );
    const getPartsStock = await service.partsServices.getPartsStock(
      mongoConnString
    );
    await socketSendMessage("DATA/INCOMING-MANUAL", getPartsStock.data);

    partsInLogger.info(
      `${req.headers["x-tenant-code"]} - Captured Incoming Stock created successfully`,
      {
        data: CreateCaptureStock.data,
      }
    );
    if (CreateCaptureStock.statusCode === 400) {
      return res.status(400).send(CreateCaptureStock);
    } else if (CreateCaptureStock.statusCode === 401) {
      return res.status(401).send(CreateCaptureStock);
    } else if (CreateCaptureStock.statusCode === 307) {
      return res.status(307).send(CreateCaptureStock);
    } else if (CreateCaptureStock.statusCode === 201) {
      return res.status(201).send(CreateCaptureStock);
    } else if (CreateCaptureStock.statusCode === 202) {
      return res.status(202).send(CreateCaptureStock);
    } else if (CreateCaptureStock.statusCode === 500) {
      return res.status(500).send(CreateCaptureStock);
    } else if (CreateCaptureStock.statusCode === 200) {
      return res.status(200).send(CreateCaptureStock.data);
    } else if (CreateCaptureStock.statusCode === 404) {
      return res.status(500).send(CreateCaptureStock);
    }
  } catch (error) {
    partsInLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send(error);
  }
};

exports.getAllStocks = async (req: Request, res: Response) => {
  partsInLogger.info(`${req.headers["x-tenant-code"]} - Get All Stocks `);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
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

    const fieldsToSearch = ["partNumber", "uniqueId", "receiptNumber"];

    let searchCriteria: any = {};

    if (searchQuery) {
      searchCriteria.$or = fieldsToSearch.map((field) => ({
        [field]: { $regex: new RegExp(searchQuery, "i") },
      }));
    }
    const queryResult: ResponseInterface =
      await service.partsServices.getAllStocks(
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
        message: "Stcoks data fetched successfully",
      });
    } else {
      res.status(500).send({
        message: "Some error occurred while fetching stocks data",
        detail: queryResult.error,
      });
    }
  } catch (error) {
    partsInLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to get all stocks`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request.",
    });
  }
};

exports.getPartsList = async (req: Request, res: Response) => {
  partsInLogger.info(`${req.headers["x-tenant-code"]} - Get Parts List`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const getPartsListData: ResponseInterface =
      await service.partsIn.getPartsList(req.params.id, mongoConnString);
    partsInLogger.info(
      `${req.headers["x-tenant-code"]} - Fetched Parts List successfully`,
      {
        data: getPartsListData.data,
      }
    );
    return res.status(200).send(getPartsListData.data);
  } catch (error) {
    partsInLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Data validation fail",
    });
  }
};

exports.updatePartsList = async (req: Request, res: Response) => {
  partsInLogger.info(`${req.headers["x-tenant-code"]} - Update Parts List`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const updatePartsListData: ResponseInterface =
      await service.partsIn.updateByIDPartsList(
        req.params.id,
        req.body,
        mongoConnString
      );

    partsInLogger.info(
      `${req.headers["x-tenant-code"]} - Updated Parts List successfully`,
      {
        data: updatePartsListData.data,
      }
    );
    if (updatePartsListData.status) {
      if (updatePartsListData.message) {
        return res.status(200).send({ message: updatePartsListData.message });
      }
      return res.status(200).send(updatePartsListData.data);
    } else {
      return res.status(400).send({
        message: "Parts List update failed",
        error: updatePartsListData.data,
      });
    }
  } catch (error: any) {
    partsInLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.trailRun = async (req: Request, res: Response) => {
  partsInLogger.info(`${req.headers["x-tenant-code"]} - Creating a Trail Run`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const data = req.body;
    (data.templateName = ""), (data.templateId = "");
    const trailRun: any = await service.camera.trailRun(data, mongoConnString);
    partsInLogger.info(
      `${req.headers["x-tenant-code"]} - Trail run created successfully`
    );
    if (trailRun?.statusCode != 200) {
      return res.status(trailRun.statusCode).send(trailRun);
    } else {
      return res.status(200).send(trailRun);
    }
  } catch (error) {
    partsInLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    console.log(error);
  }
};

exports.stickerData = async (req: Request, res: Response) => {
  partsInLogger.info(`${req.headers["x-tenant-code"]} - Get sticker data`);
  partsInLogger.debug(`Request body: ${JSON.stringify(req.body)}`);
  try {
    const pythonIp = config.server.pythonIp;
    const data = await axios.post(`${pythonIp}/barcodeData`, req.body);
    return res.status(200).send({ data: data.data });
    // return res.status(200).send({ data: {"QrCode" : ["RC0805JR-071KL$5000$LOT01$2424$MSY"]} });
  } catch (error) {
    partsInLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to get sticker data`,
      { error: error }
    );
    return res.status(500).send({
      message: "camera not connected ",
      error,
    });
  }
};
