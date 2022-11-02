import crypto from "crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { createUserService, deleteUserService, getUserService, getUserWithNotSelectedFields, updateUserService } from "../services/user.service";
import { loginCookieConfig } from "../utils/auth";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";
import logger from "../utils/logger";
import { EmailOptions, sendEmail } from "../utils/send-email";
import { userDataToSend } from "../utils/user";
import * as z from "../zod-schema/auth.schema";

// ========================
// Controllers
// ========================

export async function signupController(
  req: Request<{}, {}, z.SignupSchema["body"]>,
  res: Response
) {
  // Creating new user
  var { username, email, password } = req.body;
  var user = await createUserService({
    username,
    email,
    passwordDigest: password,
  });

  // Send email verification mail
  var token = user.getEmailVerificationToken();
  await user.save({ validateModifiedOnly: true });
  user.passwordDigest = undefined; // rm pwd hash after updating user in the db
  var url = `${req.protocol}://${req.get("host")}`;
  url += `/api/auth/confirm-email/${token}`;
  var opts: EmailOptions = {
    to: user.email,
    subject: "Verify your email",
    text: `Please click on the link to confirm your email: ${url}`,
    html: `Please click on the link to confirm your email: 🔗 <a href="${url}">Link</a>`,
  };

  try {
    await sendEmail(opts);
    var status = 201;
    var msg = "Account created successfully. Email sent to verify your email";
  } catch (error) {
    // Resetting fields after failed email sending
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });

    logger.error(`Error sending email: ${error}`);
    var status = 500;
    var msg = "Account created successfully";
  } finally {
    // Logging user in
    let accessToken = user.generateAccessToken();
    let refreshToken = user.generateRefreshToken();
    res.cookie("refreshToken", refreshToken, loginCookieConfig);

    return sendResponse(res, {
      status,
      msg,
      data: { user: userDataToSend(user), accessToken },
    });
  }
}

export async function cancelOAuthController(req: Request, res: Response) {
  if (!req.user) return sendResponse(res, { status: 401, msg: "Unauthorized" });

  await deleteUserService({ _id: req.user?._id });
  if (req.logOut) {
    // OAuth logout
    req.logOut(function logout() {
      return sendResponse(res, { status: 200, msg: "Signup cancelled" });
    });
  }
}

export async function completeOAuthController(
  req: Request<{}, {}, z.CompleteOAuthSchema["body"]>,
  res: Response
) {
  var { username, email } = req.body;
  await updateUserService({ _id: req.user?._id }, { username, email });
  return sendResponse(res, { status: 200, msg: "Signup completed" });
}

export async function loginController(
  req: Request<{}, {}, z.LoginSchema["body"]>,
  res: Response
) {
  // Check if the user exists. Also get passwordDigest too as it will be
  // used while using checkPassword method
  var { email, password } = req.body;
  var user = await getUserWithNotSelectedFields({ email }, "+passwordDigest");
  if (!user) throw new BaseApiError(404, "User not found");

  // If the user doesn't have a password field, meaning user has signed up using OAuth
  // and is using that email to login, then throw error
  if (!user.passwordDigest) {
    throw new BaseApiError(
      400,
      "You're using wrong login method, please use OAuth"
    );
  }

  // Verify the password
  if (!(await user.verifyPassword(password))) {
    throw new BaseApiError(401, "Incorrect password");
  }

  // Generate refresh and access tokens
  var accessToken = user.generateAccessToken();
  var refreshToken = user.generateRefreshToken();
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true, // so that the cookie cannot be accessed/modified in the frontend
    // secure: process.env.NODE_ENV == "production", // cookie will only be sent in a HTTPS connection in production
    secure: true,
    sameSite: "none", // to allow the cookie to be sent to the server in cross-site requests
    // maxAge: 2 * 60 * 1000, // 2 minutes, should match the expiresIn of the refresh token
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 days
  });

  // Send the user data and access token
  user.passwordDigest = undefined;
  return sendResponse(res, {
    status: 200,
    msg: "Logged in successfully",
    data: { user, accessToken },
  });
}

export async function getEmailVerificationLinkController(
  req: Request<{}, {}, z.ZodGetEmailVerificationLink["body"]>,
  res: Response
) {
  // Check if the user exists
  var email = req.body.email;
  var user = await getUserService({ email });
  if (!user) throw new BaseApiError(404, "User not found");

  // Check if the user's email is already verified OR not
  if (user.isEmailVerified) {
    throw new BaseApiError(400, "Email already verified");
  }

  // Send email verification link to user's email
  var token = user.getEmailVerificationToken();
  await user.save({ validateModifiedOnly: true }); // saving token info to DB
  var endpoint = `/api/auth/confirm-email/${token}`;
  var confirmEmailURL = `${req.protocol}://${req.get("host")}${endpoint}`;
  var opts: EmailOptions = {
    to: user.email,
    subject: "Confirm your email",
    text: `Please click on the link to confirm your email: ${confirmEmailURL}`,
    html: `Please click on the link to confirm your email: 🔗 <a href="${confirmEmailURL}">Link</a>`,
  };

  try {
    await sendEmail(opts);
    return sendResponse(res, { status: 200, msg: "Email sent successfully" });
  } catch (error) {
    // Reset the token and tokenExpiresAt
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });
    return sendResponse(res, { status: 500, msg: "Failed to send email" });
  }
}

export async function confirmEmailVerificationController(
  req: Request<z.ZodConfirmEmailVerification["params"]>,
  res: Response
) {
  // Verify the token
  var token = req.params.token;
  var encryptedToken = crypto.createHash("sha256").update(token).digest("hex");
  var user = await getUserService({
    emailVerificationToken: encryptedToken,
    emailVerificationTokenExpiresAt: { $gt: new Date(Date.now()) }, // token should not be expired
  });
  if (!user) throw new BaseApiError(400, "Invalid or expired token");

  // Verify user's email and activate the account
  user.isEmailVerified = true;
  user.isActive = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiresAt = undefined;
  await user.save({ validateModifiedOnly: true });

  res.redirect(301, `${process.env.FRONTEND_BASE_URL}`);
}

export async function testAuthController(req: Request, res: Response) {
  sendResponse(res, { status: 200, msg: "You are authorized" });
}

export async function getNewAccessTokenController(req: Request, res: Response) {
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
        if (error) throw new BaseApiError(401, "Invalid refresh token");
        var user = await getUserService({ _id: (decoded as any).id });
        if (!user) throw new BaseApiError(404, "User not found");
        var accessToken = user.generateAccessToken();
        return sendResponse(res, {
          status: 200,
          msg: "New access token generated successfully",
          data: { user, accessToken },
        });
      }
    );
  } catch (error) {
    throw new BaseApiError(401, "Invalid refresh token");
  }
}

// TODO: set the endpoint to the front-end's password reset URL
export async function forgotPasswordController(
  req: Request<{}, {}, z.ZodForgotPassword["body"]>,
  res: Response
) {
  // Chech if the user exists
  var email = req.body.email;
  var user = await getUserService({ email });
  if (!user) throw new BaseApiError(404, "User not found");

  // Send reset password link to user's email
  var token = user.getPasswordResetToken();
  await user.save(); // saving token info to DB
  // var endpoint = `/api/auth/reset-password/${token}`;
  // var resetPasswordURL = `${req.protocol}://${req.get("host")}${endpoint}`;
  var resetPasswordURL = `${process.env.FRONTEND_BASE_URL}/password-reset?token=${token}`;
  var opts: EmailOptions = {
    to: user.email,
    subject: "Reset your password",
    text: `Please click on the link to reset your password: ${resetPasswordURL}`,
    html: `Please click on the link to reset your password: 🔗 <a href="${resetPasswordURL}">Link</a>`,
  };

  try {
    await sendEmail(opts);
    return sendResponse(res, { status: 200, msg: "Email sent successfully" });
  } catch (error) {
    // Reset the token and tokenExpiresAt
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });
    return sendResponse(res, { status: 500, msg: "Failed to send email" });
  }
}

export async function resetPasswordController(
  req: Request<z.ZodResetPassword["params"], {}, z.ZodResetPassword["body"]>,
  res: Response
) {
  // Check the token
  var token = req.params.token;
  var encryptedToken = crypto.createHash("sha256").update(token).digest("hex");
  var user = await getUserService({
    passwordResetToken: encryptedToken,
    passwordResetTokenExpiresAt: { $gt: new Date(Date.now()) }, // token should not be expired
  });
  if (!user) throw new BaseApiError(400, "Invalid or expired token");

  // Update the password
  var { password } = req.body;
  user.passwordDigest = password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresAt = undefined;
  await user.save({ validateModifiedOnly: true }); // Saving the passwordDigest
  user.passwordDigest = undefined; // Removing the passwordDigest from the user object

  return sendResponse(res, { status: 200, msg: "Password reset successfully" });
}

export async function logoutController(req: Request, res: Response) {
  if (req.cookies?.refreshToken) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      // secure: process.env.NODE_ENV == "production",
      secure: true,
      sameSite: "none",
    });
  } else if (req.logOut) {
    req.logOut(function successfulOAuthLogout() {});
  }
  return sendResponse(res, { status: 200, msg: "Logged out successfully" });
}
