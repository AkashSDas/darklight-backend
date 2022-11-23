import { Router } from "express";
import * as ctrl from "../_controller/auth.controller";
import verifyAuth from "../_middlewares/auth.middleware";
import { validateResource } from "../_middlewares/zod.middleware";
import * as z from "../_schema/auth.schema";
import { handleMiddlewareError } from "../_utils/async.util";
import { sendErrorResponse } from "../_utils/error.util";

export var router = Router();

// ==================================
// SIGNUP ROUTES
// ==================================

// Email/password signup
router.post(
  "/signup",
  validateResource(z.signupSchema),
  handleMiddlewareError(ctrl.signupController),
  sendErrorResponse
);

// Cancel oauth signup (post oauth signup)
router.delete(
  "/cancel-oauth",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.cancelOAuthController),
  sendErrorResponse
);

// Complete OAuth signup (post oauth signup)
router.put(
  "/complete-oauth",
  validateResource(z.completeOAuthSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.completeOAuthController),
  sendErrorResponse
);

// ==================================
// LOGIN ROUTES
// ==================================

// Email/password login
router.post(
  "/login",
  validateResource(z.loginSchema),
  handleMiddlewareError(ctrl.loginController),
  sendErrorResponse
);

// Get new access token (email/password login)
router.get(
  "/access-token",
  handleMiddlewareError(ctrl.accessTokenController),
  sendErrorResponse
);

// ==================================
// EMAIL VERIFICATION ROUTES
// ==================================

router
  .post(
    "/verify-email",
    validateResource(z.verifyEmailSchema),
    handleMiddlewareError(ctrl.verifyEmailController),
    sendErrorResponse
  )
  .put(
    "/confirm-email/:token",
    validateResource(z.confirmEmailSchema),
    handleMiddlewareError(ctrl.confrimEmailController),
    sendErrorResponse
  );
