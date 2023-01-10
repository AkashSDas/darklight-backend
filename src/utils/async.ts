import { NextFunction, Request, Response } from "express";

// =====================================
// Async Helper
// =====================================

type AsyncResult = Promise<{ data: unknown; error: unknown }>;

/**
 * @param promise Promise to handle
 * @returns Object with 2 results {data, error}. If there is an
 * error, data will be null and vice versa
 */
export async function handleAsync(promise: Promise<any>): AsyncResult {
  try {
    return { data: await promise, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// =====================================
// Async Middleware
// =====================================

type AsyncMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Handle async middleware errors
 *
 * @param fn A middleware OR controller function that returns a promise
 * @returns The given middleware function is returned along with error handling
 */
export function handleMiddlewareError(fn: AsyncMiddleware): AsyncMiddleware {
  return function addCatchError(req, res, next) {
    return fn(req, res, next).catch(next);
  };
}
