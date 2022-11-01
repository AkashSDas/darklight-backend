import { Request, Response } from "express";

import { UserRole } from "../models/user.model";
import { getUserCount } from "../services/user.service";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";
import { UserExistsSchema } from "../zod-schema/user.schema";

// ========================
// Types
// ========================

type UserExistsReq = Request<{}, {}, {}, UserExistsSchema["query"]>;

// ========================
// Controllers
// ========================

export async function userExistsController(req: UserExistsReq, res: Response) {
  var { email, username } = req.query;

  // Check if email exists
  if (email) {
    let count = await getUserCount({ email });
    return sendResponse(res, {
      status: 200,
      msg: count == 0 ? "Available" : "Already used",
      data: { available: count == 0 ? true : false },
    });
  }

  // Check if username exists
  if (username) {
    let count = await getUserCount({ username });
    return sendResponse(res, {
      status: 200,
      msg: count == 0 ? "Available" : "Already used",
      data: { available: count == 0 ? true : false },
    });
  }

  // Invalid field
  return sendResponse(res, { status: 400, msg: "Invalid request" });
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
