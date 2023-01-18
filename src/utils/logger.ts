import { createLogger, format, Logger, transports } from "winston";

import { getEnv } from "./config";

var baseFormat = format.printf(({ level, message, timestamp }) => {
  return `[${level}] ${timestamp} ${message}`;
});

function developmentLogger(): Logger {
  return createLogger({
    level: "debug",
    format: format.combine(
      format.colorize(),
      format.timestamp({ format: "HH:mm:ss" }),
      baseFormat
    ),
    transports: [new transports.Console({})],
  });
}

function productionLogger(): Logger {
  return createLogger({
    level: "info",
    // We want server timestamp for production
    format: format.combine(format.timestamp(), baseFormat),
    transports: [
      new transports.Console({}),
      new transports.File({ filename: "./logs/error.log", level: "error" }),
    ],
  });
}

if (getEnv().env == "production") {
  var logger = productionLogger();
} else {
  var logger = developmentLogger();
}

export default logger;
