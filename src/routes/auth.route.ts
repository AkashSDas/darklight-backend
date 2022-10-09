import { Router } from "express";

import { getEmailVerificationLinkController, signupController } from "../controller/auth.controller";
import { validateResource } from "../middlewares/validate-resource";
import { handleAsyncMiddleware } from "../utils/handle-async";
import { handleCtrlError } from "../utils/handle-error";
import { getEmailVerificationLinkSchema, signupSchema } from "../zod-schema/auth.schema";

export var router = Router();

// Signup
router.post(
  "/signup",
  validateResource(signupSchema),
  handleAsyncMiddleware(signupController),
  handleCtrlError
);

// Email verification
router.post(
  "/verify-email",
  validateResource(getEmailVerificationLinkSchema),
  handleAsyncMiddleware(getEmailVerificationLinkController),
  handleCtrlError
);
