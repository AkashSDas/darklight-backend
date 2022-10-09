import { Router } from "express";

import { confirmEmailVerificationController, forgotPasswordController, getEmailVerificationLinkController, getNewAccessTokenController, loginController, logoutController, resetPasswordController, signupController, testAuthController } from "../controller/auth.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyJwt from "../middlewares/verify-jwt";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import { confirmEmailVerificationSchema, forgotPasswordSchema, getEmailVerificationLinkSchema, loginSchema, resetPasswordSchema, signupSchema } from "../zod-schema/auth.schema";

export var router = Router();

// Signup
router.post(
  "/signup",
  validateResource(signupSchema),
  handleMiddlewarelError(signupController),
  sendErrorResponse
);

// Email verification
router
  .post(
    "/verify-email",
    validateResource(getEmailVerificationLinkSchema),
    handleMiddlewarelError(getEmailVerificationLinkController),
    sendErrorResponse
  )
  .get(
    "/confirm-email/:token",
    validateResource(confirmEmailVerificationSchema),
    handleMiddlewarelError(confirmEmailVerificationController),
    sendErrorResponse
  );

// Login
router.post(
  "/login",
  validateResource(loginSchema),
  handleMiddlewarelError(loginController),
  sendErrorResponse
);

// Test auth
router.get(
  "/test",
  handleMiddlewarelError(verifyJwt),
  handleMiddlewarelError(testAuthController),
  sendErrorResponse
);

// Get new access token
router.get(
  "/access-token",
  handleMiddlewarelError(getNewAccessTokenController),
  sendErrorResponse
);

// Forgot password and reset password
router
  .post(
    "/forgot-password",
    validateResource(forgotPasswordSchema),
    handleMiddlewarelError(forgotPasswordController),
    sendErrorResponse
  )
  .post(
    "/reset-password/:token",
    validateResource(resetPasswordSchema),
    handleMiddlewarelError(resetPasswordController),
    sendErrorResponse
  );

router.post(
  "/logout",
  handleMiddlewarelError(logoutController),
  sendErrorResponse
);
