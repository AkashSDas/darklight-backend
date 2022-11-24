import { Request, Response } from "express";
import { UserExists } from "../_schema/user.schema";
import { userExistsService } from "../_services/user.service";
import { BaseApiError } from "../_utils/error.util";
import { UserRole } from "../_utils/user.util";

// ==================================
// OTHER CONTROLLERS
// ==================================

/**
 * Check if the user exists OR not
 *
 * @route GET /api/v2/user/exists
 *
 * @remark Field to check are passed as query params
 * @remark Fields that can be used to check if the user exists are:
 * - email
 * - username
 */
export async function userExistsController(
  req: Request<{}, {}, {}, UserExists["query"]>,
  res: Response
) {
  var { email, username } = req.query;
  var exists = false;

  if (email) {
    exists = !((await userExistsService({ email })) == null);
  } else if (username) {
    exists = !((await userExistsService({ username })) == null);
  } else {
    throw new BaseApiError(400, "Invalid request");
  }

  return res.status(200).json({ exists });
}

// ==================================
// INFO CONTROLLERS
// ==================================

/**
 * Get logged in user info
 *
 * @route GET /user/me
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function getUserController(req: Request, res: Response) {
  return res.status(200).json(req.user);
}

// ==================================
// INSTRUCTOR CONTROLLERS
// ==================================

/**
 * Add instructor role to the user
 *
 * @route PUT /user/instructor-signup
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function instructorSignupController(req: Request, res: Response) {
  var user = req.user;

  if ((user.roles as UserRole[]).includes(UserRole.TEACHER)) {
    throw new BaseApiError(400, "Already a teacher");
  }

  (user.roles as UserRole[]).push(UserRole.TEACHER);
  await (user as any).save();
  return res
    .status(200)
    .json({ message: "Successfully signed up as a teacher" });
}
