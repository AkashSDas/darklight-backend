import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User from "../models/user.model";
import * as z from "../schema/auth.schema";
import { loginCookieConfig } from "../utils/auth.util";
import { EmailOptions, sendEmail, sendVerificationEmail } from "../utils/mail.util";

// ==================================
// SIGNUP CONTROLLERS
// ==================================

/**
 * Signup a new user and send verification email
 * @route POST /auth/signup
 * @remark username, email, password are required
 */
export async function signupController(
  req: Request<{}, {}, z.Signup["body"]>,
  res: Response
) {
  var { username, email, password } = req.body;
  var user = await User.create({ username, email, password });
  var success = await sendVerificationEmail(user);
  var message = success
    ? "Account created, verification email sent"
    : "Account created";

  // Login user
  {
    let accessToken = user.accessToken();
    let refreshToken = user.refreshToken();
    res.cookie("refreshToken", refreshToken, loginCookieConfig);
    user.password = undefined; // remove password from response
    return res.status(201).json({ message, accessToken, user });
  }
}

/**
 * Cancel OAuth signup process and delete the user
 * @route DELETE /auth/signup
 * @remark User that logged in will be deleted and OAuth session
 * will be logged out
 *
 * Middleware used are:
 * - verifyAuth
 */
export async function cancelOAuthController(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  var user = await User.findByIdAndDelete(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (req.logOut) req.logOut(function () {});
  return res.status(200).json({ user });
}

/**
 * Complete user OAuth signup process by saving compulsory fields
 * @route PUT /auth/complete-oauth
 * @remark User that logged in will be updated with compulsory fields
 *
 * Middleware used are:
 * - verifyAuth
 */
export async function completeOAuthController(
  req: Request<{}, {}, z.CompleteOAuth["body"]>,
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

// ==================================
// LOGIN CONTROLLERS
// ==================================

/**
 * Login user with email and password
 * @route POST /auth/login
 * @remark access token will be sent in response cookie and body
 */
export async function loginController(
  req: Request<{}, {}, z.Login["body"]>,
  res: Response
) {
  var { email, password } = req.body;
  var user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!user.password) {
    return res.status(400).json({ message: "Invalid login method" });
  }

  {
    let isMatch = await user.verifyPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });
  }

  {
    let accessToken = user.accessToken();
    let refreshToken = user.refreshToken();
    res.cookie("refreshToken", refreshToken, loginCookieConfig);
    user.password = undefined; // remove password from response
    return res.status(200).json({ user, accessToken });
  }
}

/**
 * Get a new access token using refresh token
 * @route GET /auth/access-token
 * @remark throwning an error inside the callback of jwt.verify was not working
 * and there was a timeout error. So, I sent a response instead of throwing an error
 * and it working fine. Follow the test cases regarding this.
 */
export async function accessTokenController(req: Request, res: Response) {
  var refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) res.status(400).json({ message: "Unauthorized" });
  else {
    try {
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async function getNewAccessToken(
          err: jwt.VerifyErrors,
          decoded: string | jwt.JwtPayload
        ) {
          if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token has expired" });
          }

          var user = await User.findById((decoded as any)._id);
          if (!user) return res.status(404).json({ message: "User not found" });
          var accessToken = user.accessToken();
          return res.status(200).json({ user, accessToken });
        }
      );
    } catch (error) {
      res.status(400).json({ message: "Invalid token" });
    }
  }
}

// ==================================
// EMAIL VERIFICATION CONTROLLERS
// ==================================

/**
 * Send verification email to user email
 * @route POST /auth/verify-email
 */
export async function verifyEmailController(
  req: Request<{}, {}, z.VerifyEmail["body"]>,
  res: Response
) {
  var { email } = req.body;
  var user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.verified)
    return res.status(400).json({ message: "Already verified" });

  var success = await sendVerificationEmail(user);
  var message = success ? "Verification email sent" : "Failed to send email";
  return res.status(success ? 200 : 500).json({ message });
}

/**
 * Verify user email
 * @route PUT /auth/confirm-email/:token
 * @remark token is sent in email
 * @remark after successful verification, user will be redirected to `FRONTEND_BASE_URL`
 */
export async function confirmEmailController(
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

  return res.redirect(301, process.env.FRONTEND_BASE_URL);
}

// ==================================
// PASSWORD RESET CONTROLLERS
// ==================================

/**
 * Send password reset link to user's registered email
 * @route POST /auth/forgot-password
 */
export async function forgotPasswordController(
  req: Request<{}, {}, z.ForgotPassword["body"]>,
  res: Response
) {
  var { email } = req.body;
  var user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  var token = user.generatePasswordResetToken();
  await user.save({ validateModifiedOnly: true });

  var url = `${process.env.FRONTEND_BASE_URL}/auth/password-reset/${token}`;
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
 * @route PUT /auth/password-reset/:token
 */
export async function passwordResetController(
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
  user.password = req.body?.password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  await user.save({ validateModifiedOnly: true });

  return res.status(200).json({ message: "Password reset successfully" });
}

// ==================================
// OTHER CONTROLLERS
// ==================================

/**
 * Logout user with email/password login OR social login
 * @route GET /auth/logout
 */
export async function logoutController(req: Request, res: Response) {
  if (req.cookies?.refreshToken) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      // secure: process.env.NODE_ENV == "production",
    });
  } else if (req.logOut) {
    req.logOut(function successfulOAuthLogout() {});
  }

  return res.status(200).json({ message: "Logged out" });
}
