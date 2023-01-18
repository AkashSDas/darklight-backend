import { NextFunction, Request, Response } from "express";

import logger from "./logger";

/**
 * API error class
 * @example throw new BaseApiError(404, "Not found")
 */
export class BaseApiError extends Error {
  public message: string;
  public status: number;
  public isOperational: boolean;

  constructor(status: number, message: string) {
    super(message);

    this.message = message;
    this.status = status;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle errors for API controller
 *
 * @example app.use(handleCtrlError)
 * @example route.get("/route", handleMiddlewarelError((req, res) => { ... }))
 *
 * @remarks Your error handler middleware MUST have 4 parameters: error,
 * req, res, next. Otherwise your handler won't fire.
 * https://stackoverflow.com/a/61464426
 */
export function sendErrorResponse(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  var status = 500;
  var message = "Internal Server Error";

  if (err instanceof Error) {
    message = err.message;
    if (err instanceof BaseApiError) status = err.status;
  }

  logger.error((err as any)?.message ?? err);
  return res.status(status).json({ message });
}
