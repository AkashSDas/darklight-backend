import { Request, Response } from "express";

import User from "../models/user.schema";
import { getLoginCookieConfig } from "../utils/auth";
import { BaseApiError } from "../utils/error";
import logger from "../utils/logger";
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
 * Complete OAuth signup
 * @route POST /api/v2/auth/signup/complete
 * @remark Middleware: verifyAuth
 */
export async function completeOauthSignup(
  req: Request<{}, {}, z.CompleteOauth["body"]>,
  res: Response
) {
  var { email, username } = req.body;

  var user = await (async function updateUser() {
    try {
      return await User.findOneAndUpdate(
        { _id: req.user._id },
        { email, username },
        { new: true }
      );
    } catch (error) {
      if (error instanceof BaseApiError) throw error;
      logger.error(error);
      throw new BaseApiError(500, "Failed to update user");
    }
  })();

  return res.status(200).json({ user });
}

// =====================================
// Login
// =====================================

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

// =====================================
// Others
// =====================================

/**
 * Logout user with email/password login OR social login
 * @route GET /api/v2/auth/logout
 */
export async function logout(req: Request, res: Response) {
  if (req.cookies?.refreshToken) {
    res.clearCookie("refreshToken", getLoginCookieConfig());
  } else if ((req as any).logOut) {
    (req as any).logOut(function successfulOAuthLogout() {});
  }

  return res.status(200).json({ message: "Logged out" });
}
