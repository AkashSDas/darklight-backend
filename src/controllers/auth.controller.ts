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
  var user = await User.create({ username, email, passwordDigest: password });
  user.passwordDigest = undefined; // remove password from response

  // Login user
  var accessToken = user.getAccessToken();
  var refreshToken = user.getRefreshToken();
  res.cookie("refreshToken", refreshToken, getLoginCookieConfig());

  return res.status(201).json({ user, accessToken });
}

/**
 * Login user with email and password
 * @route POST /api/v2/auth/login
 * @remark access token will be sent in response cookie and body
 */
export async function login(
  req: Request<{}, {}, z.Login["body"]>,
  res: Response
) {
  var { email, password } = req.body;
  var user = await User.findOne({ email }).select("+passwordDigest");
  if (!user) return res.status(404).json({ message: "User doesn't exists" });
  if (!user.passwordDigest) {
    return res.status(400).json({ message: "Invalid login method" });
  }

  {
    // Verify password
    let isPasswordValid = await user.verifyPassword(password);
    user.passwordDigest = undefined; // rm password digest from response
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Wrong password" });
    }
  }

  {
    let accessToken = user.getAccessToken();
    let refreshToken = user.getRefreshToken();
    res.cookie("refreshToken", refreshToken, getLoginCookieConfig());
    return res.status(200).json({ user, accessToken });
  }
}
