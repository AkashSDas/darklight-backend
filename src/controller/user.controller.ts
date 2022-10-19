import { Request, Response } from "express";
import validator from "validator";

import { UserRole } from "../models/user.model";
import { getUserCount } from "../services/user.service";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";
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

export async function instructorSignupController(req: Request, res: Response) {
  var user = req.user;
  if (!user) throw new BaseApiError(404, "User not found");

  if (user.roles.includes(UserRole.INSTRUCTOR)) {
    throw new BaseApiError(400, "User is already an instructor");
  }

  user.roles.push(UserRole.INSTRUCTOR);
  await (user as any).save();
  return sendResponse(res, {
    status: 200,
    msg: "You are now an instructor",
  });
}
