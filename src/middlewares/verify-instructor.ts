import { NextFunction, Request, Response } from "express";

import { UserRole } from "../models/user.model";
import { BaseApiError } from "../utils/handle-error";

export default async function verifyInstructor(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  var user = req.user;

  if (!user) {
    throw new BaseApiError(404, "You're not logged in");
  }

  if (!user.roles.includes(UserRole.INSTRUCTOR)) {
    throw new BaseApiError(403, "You don't have the required permissions");
  }

  next();
}
