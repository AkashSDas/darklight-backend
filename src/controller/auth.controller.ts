import crypto from "crypto";
import { Request, Response } from "express";

import { createUserService, getUserService } from "../services/user.service";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";
import logger from "../utils/logger";
import { EmailOptions, sendEmail } from "../utils/send-email";
import { ZodConfirmEmailVerification, ZodGetEmailVerificationLink, ZodSignup } from "../zod-schema/auth.schema";

export async function signupController(
  req: Request<{}, {}, ZodSignup["body"]>,
  res: Response
) {
  var { fullName, username, email, password } = req.body;
  var user = await createUserService({
    fullName,
    username,
    email,
    passwordDigest: password, // it will be converted to hash in `pre` Mongoose middleware
  });

  // Send email verification link to user's email
  var token = user.getEmailVerificationToken();
  await user.save({ validateModifiedOnly: true }); // saving token info to DB

  // Doing this after the user is saved to DB because if it is done above the passwordDigest will be undefined
  // and it will give error in `pre` save hook (in the bcrypt.hash function) that
  // Error: Illegal arguments: undefined, number (undefined is the passwordDigest)
  user.passwordDigest = undefined; // remove the password digest from the response

  // URL sent to the user for verifying user's email
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
    return sendResponse(res, {
      status: 200,
      msg: "Email sent successfully",
      data: { user },
    });
  } catch (error) {
    // If sending email fails then make emailVerificationToken and emailVerificationTokenExpiresAt undefined
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });

    logger.error(`Error sending email: ${error}`);
    return sendResponse(res, {
      status: 500,
      msg: "Failed to send email",
      data: { user },
    });
  }
}

export async function getEmailVerificationLinkController(
  req: Request<{}, {}, ZodGetEmailVerificationLink["body"]>,
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
  req: Request<ZodConfirmEmailVerification["params"]>,
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

  return sendResponse(res, {
    status: 200,
    msg: "Email verified successfully",
    data: { user },
  });
}
