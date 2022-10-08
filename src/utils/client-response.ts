import { Response } from "express";

interface Options {
  /** Status code for the response */
  status: number;
  /** Data (message) sent to the client */
  msg: string;
  /** Additional data to send to the client */
  data?: { [key: string]: any };
}

/**
 * Send response to the client
 *
 * @param {Response} res Express response object where the response will be sent
 * @param {Options} options Options for the response
 * @returns {void} void
 * @example sendClientResponse(res, { status: 200, msg: "OK" })
 */
export function sentResponse(res: Response, options: Options): void {
  var { status, msg, data } = options;
  res.status(status).json({ msg, data });
}
