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
router.post(
  "/cancel-oauth",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.cancelOAuthController),
  sendErrorResponse
);
