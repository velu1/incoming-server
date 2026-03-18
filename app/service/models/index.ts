import { connectDBs } from "./dbConnection";

export const initDB = (mongodbURI: string) => {
  return connectDBs(mongodbURI).then((connection) => {
    const db = {
      excelTemplate: require("./incoming/excelTemplates")(connection),
      masterdata: require("./incoming/incomingMasterData")(connection),
      InvoiceData: require("./incoming/incomingInvoiceData")(connection),
      stock: require("./incoming/reelStock")(connection),
      printerConfigs: require("./settings/printerConfigurations")(connection),
      invoiceTranscation: require("./incoming/invoiceTranscation")(connection),
      inwardTemplate: require("./incoming/inwardTemplate")(connection),
      templatesHistories: require("./incoming/templateHistories")(connection),
      settingTranscation: require("./settings/settingsTransaction")(connection),
    };
    return db;
  });
};
