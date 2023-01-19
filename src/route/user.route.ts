import { Router } from "express";

import * as ctrl from "../controller/user.controller";
import verifyAuth from "../middlewares/auth.middleware";
import { validateResource } from "../middlewares/zod.middleware";
import { updateDetailsSchema, userExistsSchema } from "../schema/user.schema";
import { handleMiddlewareError } from "../utils/async.util";
import { sendErrorResponse } from "../utils/error.util";

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

// Update details
router.put(
  "/details",
  validateResource(updateDetailsSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateDetailsController),
  sendErrorResponse
);

// Update profile image
router.put(
  "/profile-image",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateProfileImageController),
  sendErrorResponse
);

// ==================================
// INSTRUCTOR ROUTES
// ==================================

router.put(
  "/instructor-signup",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.instructorSignupController),
  sendErrorResponse
);
