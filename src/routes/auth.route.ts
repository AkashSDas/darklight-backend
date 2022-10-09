import { Router } from "express";

import { confirmEmailVerificationController, getEmailVerificationLinkController, signupController } from "../controller/auth.controller";
import { validateResource } from "../middlewares/validate-resource";
import { handleAsyncMiddleware } from "../utils/handle-async";
import { handleCtrlError } from "../utils/handle-error";
import { confirmEmailVerificationSchema, getEmailVerificationLinkSchema, signupSchema } from "../zod-schema/auth.schema";

export var router = Router();

// Signup
router.post(
  "/signup",
  validateResource(signupSchema),
  handleAsyncMiddleware(signupController),
  handleCtrlError
);

// Email verification
router
  .post(
    "/verify-email",
    validateResource(getEmailVerificationLinkSchema),
    handleAsyncMiddleware(getEmailVerificationLinkController),
    handleCtrlError
  )
  .get(
    "/confirm-email/:token",
    validateResource(confirmEmailVerificationSchema),
    handleAsyncMiddleware(confirmEmailVerificationController),
    handleCtrlError
  );
