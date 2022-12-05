import { Request, Response } from "express";

import User from "../models/user.model";
import { UserExists } from "../schema/user.schema";
import { UserRole } from "../utils/user.util";

// ==================================
// OTHER CONTROLLERS
// ==================================

/**
 * Check if the user exists OR not
 * @route GET /api/v2/user/exists
 * @remark Field to check are passed as query params
 * @remark Fields that can be used to check if the user exists are: email, username
 */
export async function userExistsController(
  req: Request<{}, {}, {}, UserExists["query"]>,
  res: Response
) {
  var { email, username } = req.query;
  var exists = await User.exists({ $or: [{ email }, { username }] });
  return res.status(200).json({ exists: exists?._id ? true : false });
}

// ==================================
// INFO CONTROLLERS
// ==================================

/**
 * Get logged in user info
 * @route GET /user/me
 *
 * Middelewares used:
 * - verifyAuth
 */
export async function getUserController(req: Request, res: Response) {
  return res.status(200).json({ user: req.user });
}

// ==================================
// INSTRUCTOR CONTROLLERS
// ==================================

/**
 * Add instructor role to the user
 * @route PUT /user/instructor-signup
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function instructorSignupController(req: Request, res: Response) {
  var user = req.user;
  if ((user.roles as UserRole[]).includes(UserRole.TEACHER)) {
    return res.status(400).json({ message: "Already a teacher" });
  }

  (user.roles as UserRole[]).push(UserRole.TEACHER);
  await (user as any).save();
  return res.status(200).json({ message: "Signed up as a teacher" });
}
