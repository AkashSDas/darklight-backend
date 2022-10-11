import { NextFunction, Request, Response } from "express";

import { sendResponse } from "./client-response";
import logger from "./logger";

/**
 * API error class
 * @example throw new BaseApiError(404, "Not found")
 */
export class BaseApiError extends Error {
  public msg: string;
  public status: number;
  public isOperational: boolean;

  constructor(status: number, msg: string) {
    super(msg);

    this.msg = msg;
    this.status = status;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle errors for API controller
 *
 * @example app.use(handleCtrlError)
 * @example route.get("/route", handleCtrlError((req, res) => { ... }))
 *
 * @remarks Your error handler middleware MUST have 4 parameters: error,
 * req, res, next. Otherwise your handler won't fire.
 * https://stackoverflow.com/a/61464426
 */
export function sendErrorResponse(
  err: unknown,
  _: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(err);
  var status = (err as any)?.status || 500;
  var msg = (err as any)?.msg || "Something went wrong, Please try again";
  sendResponse(res, { status, msg });
}
