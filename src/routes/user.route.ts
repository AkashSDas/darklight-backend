import { Router } from "express";

import * as ctrls from "../controller/user.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import * as schemas from "../zod-schema/user.schema";

export var router = Router();

// ==================================
// OTHER ROUTES
// ==================================

router.get(
  "/available",
  validateResource(schemas.userExistsSchema),
  handleMiddlewarelError(ctrls.userExistsController),
  sendErrorResponse
);

// ==================================
// INFO ROUTES
// ==================================

// Get user details
router.get(
  "/me",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(ctrls.loggedInUserController),
  sendErrorResponse
);

// ==================================
// INSTRUCTOR ROUTES
// ==================================

router.post(
  "/instructor-signup",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(ctrls.instructorSignupController),
  sendErrorResponse
);
