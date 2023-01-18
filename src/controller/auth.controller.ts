import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User from "../models/user.schema";
import { loginCookieConfig } from "../utils/auth.util";
import { getEnv } from "../utils/config";
import { EmailOptions, sendEmail, sendVerificationEmail } from "../utils/mail.util";
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
  if (!user) return res.status(400).json({ message: "Account not created" });

  // Login the user
  var accessToken = user.getAccessToken();
  var refreshToken = user.getRefreshToken();
  res.cookie("refreshToken", refreshToken, loginCookieConfig);
  user.passwordDigest = undefined; // rm password from response
  return res.status(201).json({ user, accessToken });
}

/**
 * Cancel oauth signup process and delete the user
 * @route DELETE /api/v2/auth/cancel-oauth
 * @remark Middlewares used are: verifyAuth
 */
export async function cancelOauthSignup(req: Request, res: Response) {
  var user = await User.findByIdAndDelete(req.user._id);
  if (req.logOut) req.logOut(function () {});
  return res.status(200).json({ user });
}

/**
 * Complete user OAuth signup process by saving compulsory fields
 * @route PUT /api/v2/auth/complete-oauth
 * @remark Middlewares used are: verifyAuth
 */
export async function completeOauth(
  req: Request<{}, {}, z.CompleteOauth["body"]>,
  res: Response
) {
  var { username, email } = req.body;
  var user = await User.findByIdAndUpdate(
    req.user._id,
    { username, email },
    { new: true }
  );

  if (!user) return res.status(404).json({ message: "User not found" });
  return res.status(200).json({ user });
}

// =====================================
// Login
// =====================================

/**
 * Login user with email & password
 * @route POST /api/v2/auth/login
 */
export async function login(
  req: Request<{}, {}, z.Login["body"]>,
  res: Response
) {
  var { email, password } = req.body;
  var user = await User.findOne({ email }).select("+passwordDigest");
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!user.passwordDigest) {
    return res.status(400).json({ message: "Invalid login method" });
  }

  var isMatch = await user.verifyPassword(password);
  if (!isMatch) return res.status(400).json({ message: "Wrong password" });

  var accessToken = user.getAccessToken();
  var refreshToken = user.getRefreshToken();
  res.cookie("refreshToken", refreshToken, loginCookieConfig);
  user.passwordDigest = undefined; // rm password from response
  return res.status(200).json({ user, accessToken });
}

/**
 * Get a new access token using refresh token
 * @route GET /api/v2/auth/access-token
 *
 * @remark throwning an error inside the callback of jwt.verify was not working
 * and there was a timeout error. So, I sent a response instead of throwing an error
 * and it working fine. Follow the test cases regarding this.
 */
export async function accessToken(req: Request, res: Response) {
  var refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) res.status(401).json({ message: "Unauthorized" });
  else {
    try {
      jwt.verify(
        refreshToken,
        getEnv().refreshTokenSecret,
        async function getNewAccessToken(
          err: jwt.VerifyErrors,
          decoded: string | jwt.JwtPayload
        ) {
          if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token has expired" });
          } else if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid token" });
          } else if (err) {
            return res.status(401).json({ message: "Unauthorized" });
          }

          var user = await User.findById((decoded as any)._id);
          if (!user) return res.status(404).json({ message: "User not found" });
          var accessToken = user.getAccessToken();
          return res.status(200).json({ user, accessToken });
        }
      );
    } catch (error) {
      res.status(400).json({ message: "Invalid token" });
    }
  }
}

// =====================================
// Email verification
// =====================================

/**
 * Send verification email to user email
 * @route POST /api/v2/auth/verify-email
 */
export async function verifyEmail(
  req: Request<{}, {}, z.VerifyEmail["body"]>,
  res: Response
) {
  var { email } = req.body;
  var user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.verified) {
    return res.status(400).json({ message: "Already verified" });
  }

  var success = await sendVerificationEmail(user);
  var message = success ? "Verification email sent" : "Failed to send email";
  return res.status(success ? 200 : 500).json({ message });
}

/**
 * Verify user email
 * @route PUT /api/v2/auth/confirm-email/:token
 * @remark token is sent in email
 * @remark after successful verification, user will be redirected to the frontend
 */
export async function confirmEmail(
  req: Request<z.ConfirmEmail["params"]>,
  res: Response
) {
  var { token } = req.params;
  var encryptedToken = crypto.createHash("sha256").update(token).digest("hex");
  var user = await User.findOne({
    verificationToken: encryptedToken,
    verificationTokenExpiresAt: { $gt: Date.now() },
  });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Update the user's verified and active status
  user.active = true;
  user.verified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save({ validateModifiedOnly: true });

  return res.redirect(301, getEnv().frontendURL);
}

// =====================================
// Password reset
// =====================================

/**
 * Send password reset link to user's registered email
 * @route POST /api/v2/uth/forgot-password
 */
export async function forgotPassword(
  req: Request<{}, {}, z.ForgotPassword["body"]>,
  res: Response
) {
  var { email } = req.body;
  var user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  var token = user.generatePasswordResetToken();
  await user.save({ validateModifiedOnly: true });

  var url = `${getEnv().frontendURL}/auth/password-reset/${token}`;
  var opts: EmailOptions = {
    to: user.email,
    subject: "Reset your password",
    text: `Please click on the link to reset your password: ${url}`,
    html: `Please click on the link to reset your password: 🔗 <a href="${url}">Link</a>`,
  };

  try {
    await sendEmail(opts);
    return res.status(200).json({ token });
  } catch (error) {
    // Reset the token and tokenExpiresAt
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });
    return res.status(500).json({ message: "Failed to send email" });
  }
}

/**
 * Reset user's password
 * @route PUT /api/v2/auth/password-reset/:token
 */
export async function passwordReset(
  req: Request<z.PasswordReset["params"], {}, z.PasswordReset["body"]>,
  res: Response
) {
  var { token } = req.params;
  var encryptedToken = crypto.createHash("sha256").update(token).digest("hex");
  var user = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  // Update the user's password
  user.passwordDigest = req.body?.password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  await user.save({ validateModifiedOnly: true });

  return res.status(200).json({ message: "Password reset successfully" });
}

// =====================================
// Logout
// =====================================

/**
 * Logout user with email/password login OR social login
 * @route GET /api/v2/auth/logout
 */
export async function logout(req: Request, res: Response) {
  if (req.cookies?.refreshToken) {
    res.clearCookie("refreshToken", loginCookieConfig);
  } else if (req.logOut) {
    req.logOut(function successfulOAuthLogout() {});
  }

  return res.status(200).json({ message: "Logged out" });
}
