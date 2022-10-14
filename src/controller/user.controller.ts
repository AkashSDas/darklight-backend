import { Request, Response } from "express";
import validator from "validator";

import { getUserCount } from "../services/user.service";
import { sendResponse } from "../utils/client-response";
import { ZodCheckUserAvailable } from "../zod-schema/user.schema";

export async function checkUserAvailableController(
  req: Request<ZodCheckUserAvailable["params"]>,
  res: Response
) {
  var { field, value } = req.params;

  if (field == "email") {
    let valid = validator.isEmail(value) == true;
    if (!valid) return sendResponse(res, { status: 400, msg: "Invalid email" });

    let count = await getUserCount({ email: value });
    return sendResponse(res, {
      status: 200,
      msg: "User availability status",
      data: { available: count == 0 },
    });
  } else if (field == "username") {
    let valid = validator.isLength(value, { max: 120, min: 3 }) == true;
    if (!valid) {
      return sendResponse(res, { status: 400, msg: "Invalid username" });
    }

    let count = await getUserCount({ username: value });
    return sendResponse(res, {
      status: 200,
      msg: "User availability status",
      data: { available: count == 0 },
    });
  }

  return sendResponse(res, { status: 400, msg: "Invalid field" });
}

export async function getLoggedInUserController(req: Request, res: Response) {
  return sendResponse(res, {
    status: 200,
    msg: "User details",
    data: { user: req.user },
  });
}
