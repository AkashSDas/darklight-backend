import { Router } from "express";
import * as ctrl from "../_controller/user.controller";
import verifyAuth from "../_middlewares/auth.middleware";
import { validateResource } from "../_middlewares/zod.middleware";
import { userExistsSchema } from "../_schema/user.schema";
import { handleMiddlewareError } from "../_utils/async.util";
import { sendErrorResponse } from "../_utils/error.util";

export var router = Router();

// ==================================
// OTHER ROUTES
// ==================================

// Check if the user exists OR not
router.get(
  "/exists",
  validateResource(userExistsSchema),
  handleMiddlewareError(ctrl.userExistsController),
  sendErrorResponse
);

// ==================================
// INFO ROUTES
// ==================================

// Get user details
router.get(
  "/me",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.getUserController),
  sendErrorResponse
);

// ==================================
// INSTRUCTOR ROUTES
// ==================================

router.post(
  "/instructor-signup",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.instructorSignupController),
  sendErrorResponse
);
