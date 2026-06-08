require("dotenv").config();

module.exports = {
  server: {
    server: process.env.INCOMING,
  },
  fastapiUrl: process.env.PYTHON_IP,
  trialRunUrl: process.env.PYTHON_IP,
  dbConfig: {
    meta: process.env.DB_META,
    transaction: process.env.DB_TRANSACTION,
  },
  AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.CONTAINER_NAME,
};
