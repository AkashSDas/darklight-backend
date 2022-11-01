import { Router } from "express";

import * as ctrls from "../controller/user.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import * as schemas from "../zod-schema/user.schema";

export var router = Router();

router.get(
  "/available",
  validateResource(schemas.userExistsSchema),
  handleMiddlewarelError(ctrls.userExistsController),
  sendErrorResponse
);

// Get user details
router.get(
  "/me",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(ctrls.getLoggedInUserController),
  sendErrorResponse
);

router.post(
  "/instructor-signup",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(ctrls.instructorSignupController),
  sendErrorResponse
);
