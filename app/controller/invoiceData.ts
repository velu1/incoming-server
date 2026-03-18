import { Request, Response } from "express";
import { service } from "../service/app";
import { ResponseInterface } from "../interface/response.interface";
const invoiceLogger = require("../utils/logger");

exports.createInvoice = async (req: Request, res: Response) => {
  invoiceLogger.info(`${req.headers["x-tenant-code"]} - Create Invoice`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    console.log(req.body, mongoConnString);

    const createInvoiceData: ResponseInterface =
      await service.invoiceData.create(req.body, mongoConnString);
    invoiceLogger.info(
      `${req.headers["x-tenant-code"]} - Invoice data created successfully`,
      {
        data: createInvoiceData.data,
      }
    );
    return res.status(createInvoiceData.status ? 200 : 500).send({
      data: createInvoiceData.data,
    });
  } catch (error) {
    invoiceLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Failed to perform request",
      detail: error,
    });
  }
};

exports.getAllInvoiceData = async (req: Request, res: Response) => {
  invoiceLogger.info(`${req.headers["x-tenant-code"]} - Get all invoice data`);
  invoiceLogger.debug(`Request body: ${JSON.stringify(req.body)}`);
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

    const fieldsToSearch = ["receiptNumber", "partNumber", "status"];

    let searchCriteria: any = {};

    if (searchQuery) {
      searchCriteria.$or = fieldsToSearch.map((field) => ({
        [field]: { $regex: new RegExp(searchQuery, "i") },
      }));
    }
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const queryResult: ResponseInterface =
      await service.invoiceData.getAllInvoiceData(
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
        message: "Invoice data fetched successfully",
      });
    } else {
      res.status(500).send({
        message: "Some error occurred while fetching invoice data",
        detail: queryResult.error,
      });
    }
  } catch (error) {
    invoiceLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to get all invoice data`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request.",
    });
  }
};

exports.getInvoicePallet = async (req: Request, res: Response) => {
  try {
    invoiceLogger.info(
      `${req.headers["x-tenant-code"]} - Get all Invoice and Pallet`
    );
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];

    const getInvoiceData: ResponseInterface =
      await service.invoiceData.getInvoicePallet(mongoConnString);
    invoiceLogger.info(
      `${req.headers["x-tenant-code"]} - Fetched all Invoice and Pallet data`
    );
    return res.status(200).send(getInvoiceData.data);
  } catch (error) {
    invoiceLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Data validation fail",
    });
  }
};

exports.getDataByInvoiceAndPallet = async (req: Request, res: Response) => {
  invoiceLogger.info(
    `${req.headers["x-tenant-code"]} - Get data by invoice and pallet`
  );
  invoiceLogger.debug(`Request body: ${JSON.stringify(req.body)}`);
  try {
    const { invoiceNo } = req.body;
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];

    const getInvoiceData: ResponseInterface =
      await service.invoiceData.getDataByInvoiceAndPallet(
        invoiceNo,
        mongoConnString
      );
    invoiceLogger.info(
      `${req.headers["x-tenant-code"]} - Fetched all Invoice and Pallet data`
    );
    return res.status(200).send(getInvoiceData.data);
  } catch (error) {
    invoiceLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Error in fetching",
    });
  }
};

exports.getAllInvoicePalletData = async (req: Request, res: Response) => {
  invoiceLogger.info(
    `${req.headers["x-tenant-code"]} - Get all invoice pallet data`
  );
  invoiceLogger.debug(`Request body: ${JSON.stringify(req.body)}`);
  try {
    const {
      page,
      pageSize,
      searchQuery,
      sortColumn,
      sortOrder,
      download,
    }: any = req.body.pagination;
    const { invoiceNo } = req.body;

    let sort: { [key: string]: 1 | -1 } = {};
    sort[sortColumn] = sortOrder;

    const fieldsToSearch = ["partNumber", "receiptNumber"];

    let searchCriteria: any = {};

    if (searchQuery) {
      searchCriteria.$or = fieldsToSearch.map((field) => ({
        [field]: { $regex: new RegExp(searchQuery, "i") },
      }));
    }
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const queryResult: ResponseInterface =
      await service.invoiceData.getAllInvoicePalletData(
        searchCriteria,
        sort,
        page,
        pageSize,
        download,
        invoiceNo,
        mongoConnString
      );
    if (queryResult.status) {
      return res.status(200).send({
        data: queryResult.data,
        count: queryResult.count,
        message: "Invoice Pallet data fetched successfully",
      });
    } else {
      res.status(500).send({
        message: "Some error occurred while fetching invoice pallet data",
        detail: queryResult.error,
      });
    }
  } catch (error) {
    invoiceLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to get all invoice pallet data`,
      { error: error }
    );
    return res.status(500).send({
      message: "Failed to perform request.",
    });
  }
};

exports.getByIDInvoice = async (req: Request, res: Response) => {
  try {
    invoiceLogger.info(`${req.headers["x-tenant-code"]} - Get Invoice by Id`);
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const getByIdInvoiceData: ResponseInterface =
      await service.invoiceData.getByID(req.params.id, mongoConnString);
    invoiceLogger.info(
      `${req.headers["x-tenant-code"]} - Fetched Invoice by Id Successfully`,
      {
        data: getByIdInvoiceData,
      }
    );
    return res.status(200).send({
      data: getByIdInvoiceData,
      message: "Successfull!!.",
    });
  } catch (error) {
    invoiceLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Failed to perform request",
    });
  }
};

exports.updatebyIDInvoice = async (req: Request, res: Response) => {
  invoiceLogger.info(`${req.headers["x-tenant-code"]} - Update invoice data`);
  try {
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const updatedInvoiceData: ResponseInterface =
      await service.invoiceData.UpdateByID(req.body, mongoConnString);
    invoiceLogger.info(
      `${req.headers["x-tenant-code"]} - Updated invoice data successfully`,
      {
        data: updatedInvoiceData.data,
      }
    );
    return res.status(updatedInvoiceData.status ? 200 : 500).send({
      data: updatedInvoiceData.data,
      status: updatedInvoiceData.status ? 200 : 500,
    });
  } catch (error) {
    invoiceLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Failed to perform request",
      data: error,
    });
  }
};
exports.deleteByIdInvoice = async (req: Request, res: Response) => {
  try {
    invoiceLogger.info(`${req.headers["x-tenant-code"]} - delete Invoice data`);
    const mongoConnString = req.headers["x-tenant-mongodb-uri"];
    const deleteInvoiceData: ResponseInterface =
      await service.invoiceData.deleteByID(req.params.id, mongoConnString);

    invoiceLogger.info(
      `${req.headers["x-tenant-code"]} - Deleted Invoice data successfully`,
      {
        data: deleteInvoiceData,
      }
    );
    return res.status(deleteInvoiceData.status ? 200 : 500).send({
      message: deleteInvoiceData.data,
      status: deleteInvoiceData.status ? 200 : 500,
    });
  } catch (error) {
    invoiceLogger.error(
      `${req.headers["x-tenant-code"]} - Failed to perform request`
    );
    return res.status(500).send({
      message: "Data validation fail",
    });
  }
};
