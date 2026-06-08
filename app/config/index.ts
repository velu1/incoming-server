import dotenv from "dotenv";
dotenv.config();

export const config = {
  server: {
    ipAddress: process.env.IP_ADDRESS as string,
    pythonIp: process.env.PYTHON_IP as string,
    incoming: Number(process.env.INCOMING),
    server: process.env.INCOMING,
  },
  fastapiUrl: process.env.PYTHON_IP,
  trialRunUrl: process.env.PYTHON_IP,
  AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.CONTAINER_NAME,
};
