import { Request, Response } from "express";

import User from "../models/user.schema";
import { getLoginCookieConfig } from "../utils/auth";
import * as z from "../utils/zod";

// =====================================
// Signup
// =====================================

/**
 * Signup a new user
 * @route POST /api/v2/auth/signup
 * @remark username, email, password are required
 */
export async function signup(
  req: Request<{}, {}, z.Signup["body"]>,
  res: Response
) {
  var { username, email, password } = req.body;
  var user = await User.create({ username, email, password });
  user.passwordDigest = undefined; // remove password from response

  // Login user
  var accessToken = user.getAccessToken();
  var refreshToken = user.getRefreshToken();
  res.cookie("refreshToken", refreshToken, getLoginCookieConfig());

  return res
    .status(201)
    .json({ message: "Account created successfully", accessToken, user });
}
