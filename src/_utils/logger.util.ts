import { createLogger, format, Logger, transports } from "winston";

// Log format
var baseFormat = format.printf(({ level, message, timestamp }) => {
  return `[${level}] ${timestamp} ${message}`;
});

if (process.env.NODE_ENV == "production") {
  var logger = productionLogger();
} else {
  var logger = developmentLogger();
}

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

export default logger;
