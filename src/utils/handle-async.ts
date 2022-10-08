import { NextFunction, Request, Response } from "express";

/**
 * @param promise Promise to handle
 * @returns Array with 2 results [data, error]. If there
 * is an error, data will be null and vice versa
 */
export async function handleAsync(promise: Promise<any>) {
  try {
    return [await promise, null];
  } catch (err) {
    return [null, err];
  }
}

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Handle async middleware errors
 *
 * @param fn A middleware OR controller function that returns a promise
 * @returns The given middleware function is returned along with error handling
 */
export function handleAsyncMiddleware(fn: AsyncHandler): AsyncHandler {
  return function handleAsyncMiddlewareError(req, res, next) {
    return fn(req, res, next).catch(next);
  };
}
