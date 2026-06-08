const masterController = require("../controller/masterData");
const invoiceController = require("../controller/invoiceData");
const excelTemplateController = require("../controller/excelTemplate");
const partsIn = require("../controller/partsIn");
const entityMappingController = require("../controller/entityMapping");
const partHistoryReport = require("../controller/partHistoryReports");
const templateHistories = require("../controller/templateHistories");

module.exports = (app: any) => {
  // Master Data Routes
  app
    .route("/api/masterData")
    .post(masterController.createMaster)
    .patch(masterController.updatebyIDMaster);

  app.post("/api/masterData/all", masterController.getAllMasterData);

  app
    .route("/api/masterData/:id")
    .get(masterController.getByIDMaster)
    .delete(masterController.deleteByIdMaster);

  // Invoice Data Routes
  app
    .route("/api/invoice")
    .post(invoiceController.createInvoice)
    .patch(invoiceController.updatebyIDInvoice);

  app.post("/api/invoice/all", invoiceController.getAllInvoiceData);

  app.get("/api/invoicePallet", invoiceController.getInvoicePallet);

  app.post("/api/invoicePallet", invoiceController.getDataByInvoiceAndPallet);

  app.post("/api/invoicePallet/all", invoiceController.getAllInvoicePalletData);

  app
    .route("/api/invoice/:id")
    .get(invoiceController.getByIDInvoice)
    .delete(invoiceController.deleteByIdInvoice);

  // Template Routes
  app.post("/api/excelTemplate", excelTemplateController.create);
  app.get("/api/excelTemplate/:type", excelTemplateController.getByType);

  app.delete(
    "/api/excelTemplate/:id",
    excelTemplateController.deleteByIdTemplate
  );

  // validate Part Number Routes
  app.get(
    "/api/validatePartNumber/:partNumber/:invoiceNo",
    partsIn.partsValidate
  );

  app.get("/api/validatePartNumber/:partNumber", partsIn.partsValidate);

  // mannual parts in Routes
  app.route("/api/partsIn").post(partsIn.createPartsInStock);

  app.post("/api/partsIn/all", partsIn.getAllStocks);

  app.route("/api/capture").post(partsIn.createCaptureStock);

  app.route("/api/trailRun").post(partsIn.trailRun);

  // sticker data
  app.route("/api/stickerData").post(partsIn.stickerData);

  app
    .route("/api/inward/template")
    .post(entityMappingController.createInwardTemplate);

  app
    .route("/api/inward/template/all")
    .post(entityMappingController.getAllInwardTemplates);

  app
    .route("/api/inward/template/:id")
    .delete(entityMappingController.deleteInwardTemplate);

   app
    .route("/api/associate-template")
    .post(entityMappingController.associateTemplate);  

  app
    .route("/api/template-manufacturer/:invoiceNumber")
    .get(entityMappingController.getTemplateManufacturer);

  //REPORTS
  app.post("/api/partHistoryReports", partHistoryReport.getPartHistoryReport);

  //parts List
  app
    .route("/api/partsList/:id")
    .get(partsIn.getPartsList)
    .patch(partsIn.updatePartsList);

    app
    .route("/api/templateHistories")
    .post(templateHistories.getTemplateDataHistories);
    
  app
    .route("/api/inward/templateHistory")
    .post(templateHistories.createTemplateHistory);

  app
    .route("/api/inward/partNumber/:id")
    .delete(templateHistories.deletePartNumber);
};
