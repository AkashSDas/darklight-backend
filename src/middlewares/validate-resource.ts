import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

import { sendResponse } from "../utils/client-response";

/**
 * Validate the input of a request and give err is the input is invalid
 * as per the schema else move to the next middleware
 *
 * If the path isn't defined then `err.path[1]` will be undefined. So make sure
 * include path while defining the schema even for the `refine` method
 *
 * @param schema Zod schema to validate the request body
 * @returns Middleware function
 *
 * @example
 * An example for the errors in data sent by the client:
 * ```json
 * {
 *   "errors": [
 *     {
 *       "field": "fullName",
 *       "msg": "Fullname is required"
 *     },
 *     {
 *       "field": "confirmPassword",
 *       "msg": "Password and confirm password does not match"
 *     }
 *   ]
 * }
 * ```
 */
export function validateResource(schema: AnyZodObject) {
  return function validateResourceMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // If the schema is able to parse the given field then it means that
      // user has provided the required field
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (err: any) {
      console.log(err);
      return sendResponse(res, {
        status: 400,
        msg: "Missing or invalid fields",
        data: {
          errors: err.errors.map(function parseError(err: any) {
            return { field: err.path[1], msg: err.message };
          }),
        },
      });
    }
  };
}
