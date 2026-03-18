const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
let httpContext = require("express-http-context");

module.exports = createLogger({
  transports: new transports.DailyRotateFile({
    filename: "./logs/Server-Log-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    level: "info",
    format: format.combine(
      format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
      format.align(),
      format.printf((info: any) => {
        const reqId = httpContext.get("reqId") ? httpContext.get("reqId") : "";
        const dataString = info.data
          ? `\nData: ${JSON.stringify(info.data, null, 2)}`
          : ""; // Pretty print JSON

        return `${info.level.toUpperCase()}:${
          info.timestamp
        } Request ID:${reqId} Message:${info.message}${dataString}\n`;
      })
    ),
  }),
});
