import express from "express";
import bodyParser from "body-parser";
import path from "path";
import cors from "cors";
import http from "http";
import { socketConnection } from "./app/socket";

const incomingConfig = require("./app/config/index");
const incomingApp: any = express();
let corsincomingOptions = {
  origin: "*",
};
incomingApp.use(cors(corsincomingOptions));
incomingApp.use(bodyParser.json({ limit: "50mb" }));

incomingApp.get('/health', (_req: any, res: any) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});
incomingApp.use(bodyParser.urlencoded());



// For access the images from public folder
incomingApp.use("/public", express.static(path.join(__dirname, "public")));

incomingApp.get("/:value1", (req: any, res: any) => {
  console.log(req.params);
  res.send("Incoming App module");
});

require("./app/routes/incoming.route")(incomingApp);

const server = http.createServer(incomingApp);
server.maxConnections = 100;

socketConnection(server);

incomingApp.listen(incomingConfig.config.server.incoming, () => {
  console.log(`Connected.... ${incomingConfig.config.server.incoming}`);
});
