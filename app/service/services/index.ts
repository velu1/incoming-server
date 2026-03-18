let masterData = require("./incoming/masterData");
let excelTemplate = require("./incoming/excelTemplate");
let invoiceData = require("./incoming/invoiceData");
let partsIn = require("./incoming/partsIn/partsIn");
let entityMapping = require("./incoming/entityMapping");
let partHistoryReports = require("./incoming/partHistoryReports");
let camera = require("./incoming/partsIn/capture");
let partsServices = require("./incoming/partsIn/services/partsIn");
let templatesHistories = require("./incoming/templateHistories");

export const service = {
  masterData,
  excelTemplate,
  invoiceData,
  partsIn,
  entityMapping,
  partHistoryReports,
  partsServices,
  camera,
  templatesHistories,
};
