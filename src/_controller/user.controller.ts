import { Request, Response } from "express";
import { UserExistsSchema } from "../_schema/user.schema";
import { userExistsService } from "../_services/user.service";
import { BaseApiError } from "../_utils/error.util";

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
  req: Request<{}, {}, {}, UserExistsSchema["query"]>,
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
