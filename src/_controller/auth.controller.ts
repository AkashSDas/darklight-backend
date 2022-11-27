import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import User from "../_models/user.model";
import * as z from "../_schema/auth.schema";
import * as service from "../_services/user.service";
import { loginCookieConfig } from "../_utils/auth.util";
import { BaseApiError } from "../_utils/error.util";
import { EmailOptions, sendEmail, sendVerificationEmail } from "../_utils/mail.util";

// ==========================
// Signup
// ==========================

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
 *
 * @route POST /api/auth/login
 */
export async function loginController(
  req: Request<{}, {}, z.Login["body"]>,
  res: Response
) {
  // Check if the user exists. Also get password too as it will be
  // used while using verifyPassword method
  var { email, password } = req.body;
  var user = await service.getUserWithSelectService({ email }, "+password");
  if (!user) throw new BaseApiError(400, "Invalid email or password");

  // If the user doesn't have a password then it means that the user has
  // use OAuth for signup
  if (!user.password) {
    throw new BaseApiError(400, "You have signed up with OAuth");
  }

  // Check if the password is correct
  if (!(await user.verifyPassword(password))) {
    throw new BaseApiError(401, "Incorrect password");
  }

  // Generate access and refresh tokens for successful login
  var accessToken = user.accessToken();
  var refreshToken = user.refreshToken();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // so that the cookie cannot be accessed/modified in the frontend
    // secure: process.env.NODE_ENV == "production", // cookie will only be sent in a HTTPS connection in production
    secure: true,
    sameSite: "none", // to allow the cookie to be sent to the server in cross-site requests
    // maxAge: 2 * 60 * 1000, // 2 minutes, should match the expiresIn of the refresh token
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
  });

  user.password = undefined; // rm pwd hash from response
  return res.status(200).json({ user, accessToken });
}

// TODO: send descriptive msgs like token expired and so
/**
 * Get a new access token using the refresh token
 *
 * @route GET /api/auth/access-token
 *
 * @remark throwning an error inside the callback of jwt.verify was not working
 * and there was a timeout error. So, I sent a response instead of throwing an error
 * and it working fine. Follow the test cases regarding this.
 */
export async function accessTokenController(req: Request, res: Response) {
  var refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) throw new BaseApiError(401, "Unauthorized");

  try {
    // Verify the refresh token and generate a new access token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async function getNewAccessToken(
        error: jwt.VerifyErrors,
        decoded: string | jwt.JwtPayload
      ) {
        if (error) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        var user = await service.getUserService({ _id: (decoded as any)._id });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        var accessToken = user.accessToken();
        return res.status(200).json({ user, accessToken });
      }
    );
  } catch (error) {
    throw new BaseApiError(401, "Invalid refresh token");
  }
}

// ==================================
// EMAIL VERIFICATION CONTROLLERS
// ==================================

/**
 * Get email verification mail on the registered email
 *
 * @route POST /api/auth/verify-email
 */
export async function verifyEmailController(
  req: Request<{}, {}, z.VerifyEmail["body"]>,
  res: Response
) {
  // Check if the user exists
  var { email } = req.body;
  var user = await service.getUserService({ email });
  if (!user) throw new BaseApiError(404, "User not found");

  // Check if the user has already verified the email
  if (user.verified) {
    throw new BaseApiError(400, "Email is already verified");
  }

  // Generate a verification token and send it to the user
  var token = user.generateVerificationToken();
  await user.save({ validateModifiedOnly: true });

  // Send verification email
  var url = `${process.env.BASE_URL}/api/v2/auth/confirm-email/${token}`;
  var opts: EmailOptions = {
    to: user.email,
    subject: "Verify your email",
    text: `Please click on the link to confirm your email: ${url}`,
    html: `Please click on the link to confirm your email: 🔗 <a href="${url}">Link</a>`,
  };

  try {
    await sendEmail(opts);
    return res.status(200).json({ message: "Verification email sent", token });
  } catch (error) {
    // Reset the token and tokenExpiresAt
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });
    return res.status(500).json({ message: "Failed to send email" });
  }
}

/**
 * Verify user's email and active their account
 *
 * @route PUT /api/auth/confirm-email/:token
 */
export async function confrimEmailController(
  req: Request<z.ConfirmEmail["params"]>,
  res: Response
) {
  // Verify the token
  var { token } = req.params;
  var encryptedToken = crypto.createHash("sha256").update(token).digest("hex");
  var user = await service.getUserService({
    verificationToken: encryptedToken,
    verificationTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) throw new BaseApiError(400, "Invalid or expired token");

  // Update the user's verified and active status
  user.verified = true;
  user.active = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save({ validateModifiedOnly: true });

  return res.redirect(301, process.env.FRONTEND_BASE_URL);
}

// ==================================
// PASSWORD RESET CONTROLLERS
// ==================================

/**
 * Send email with password reset link with contains the token
 *
 * @route POST /api/auth/forgot-password
 */
export async function forgotPasswordController(
  req: Request<{}, {}, z.ForgotPassword["body"]>,
  res: Response
) {
  // Check if the user exists
  var { email } = req.body;
  var user = await service.getUserService({ email });
  if (!user) throw new BaseApiError(404, "User not found");

  // Generate a reset token and send it to the user
  var token = user.generatePasswordResetToken();
  await user.save({ validateModifiedOnly: true });

  // Send password reset email
  var url = `${process.env.BASE_URL}/api/v2/auth/reset-password/${token}`;
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
 *
 * @route PUT /api/auth/password-reset/:token
 */
export async function passwordResetController(
  req: Request<z.PasswordReset["params"], {}, z.PasswordReset["body"]>,
  res: Response
) {
  // Verify the token
  var { token } = req.params;
  var encryptedToken = crypto.createHash("sha256").update(token).digest("hex");
  var user = await service.getUserService({
    passwordResetToken: encryptedToken,
    passwordResetTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) throw new BaseApiError(400, "Invalid or expired token");

  // Update the user's password
  var { password } = req.body;
  user.password = password;
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
 *
 * @route GET /api/auth/logout
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

  return res.status(200).json({ message: "Logged out successfully" });
}
