import { Request, Response } from "express";
import * as z from "../_schema/auth.schema";
import * as service from "../_services/user.service";
import { loginCookieConfig } from "../_utils/auth.util";
import { BaseApiError } from "../_utils/error.util";
import { EmailOptions, sendEmail } from "../_utils/mail.util";

// ==================================
// SIGNUP CONTROLLERS
// ==================================

/**
 * Create a new user account and send a verification email
 *
 * @route POST /api/v2/auth/signup
 * @remark username, email, and password are used for this signup
 */
export async function signupController(
  req: Request<{}, {}, z.Signup["body"]>,
  res: Response
) {
  var { username, email, password } = req.body;

  // Check if user already exists
  var exists = await Promise.all([
    service.userExistsService({ username }),
    service.userExistsService({ email }),
  ]);
  if (exists[0] || exists[1]) {
    throw new BaseApiError(400, "User already exists");
  }

  // Create new user
  var user = await service.createUserService({ username, email, password });

  // Get verification token
  var token = user.generateVerificationToken();
  await user.save({ validateModifiedOnly: true });
  user.password = undefined; // rm pwd hash from response

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
    var message = "Account is created. Email sent to verify your email";
  } catch (error) {
    // Resetting fields after failed email sending
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save({ validateModifiedOnly: true });

    var message = "Account is created";
  } finally {
    // Logging the user in
    let accessToken = user.accessToken();
    let refreshToken = user.refreshToken();
    res.cookie("refreshToken", refreshToken, loginCookieConfig);

    return res.status(201).json({ user, accessToken, message });
  }
}

/**
 * Cancel OAuth signup process and delete the user
 *
 * @route POST /api/v2/auth/cancel-oauth
 *
 * Middlewares used
 * - verifyAuth
 */
export async function cancelOAuthController(req: Request, res: Response) {
  if (!req.user) throw new BaseApiError(401, "Unauthorized");

  await service.deleteUserService({ _id: req.user._id });
  if (req.logOut) {
    req.logOut(function sendResponse() {
      return res.status(200).json({ message: "Signup cancelled" });
    });
  }
}

/**
 * Save the necessary info of the user and complete OAuth signup
 *
 * @route POST /api/auth/complete-oauth
 *
 * Middlewares used
 * - verifyAuth
 */
export async function completeOAuthController(
  req: Request<{}, {}, z.CompleteOAuth["body"]>,
  res: Response
) {
  var { username, email } = req.body;
  await service.updateUserService({ _id: req.user._id }, { username, email });
  return res.status(200).json({ message: "Signup is completed" });
}
