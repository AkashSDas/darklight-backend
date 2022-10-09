import { Router } from "express";

import { confirmEmailVerificationController, getEmailVerificationLinkController, signupController } from "../controller/auth.controller";
import { validateResource } from "../middlewares/validate-resource";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import { confirmEmailVerificationSchema, getEmailVerificationLinkSchema, signupSchema } from "../zod-schema/auth.schema";

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
