import { Router } from "express";

import { signupController } from "../controller/auth.controller";
import { validateResource } from "../middlewares/validate-resource";
import { handleAsyncMiddleware } from "../utils/handle-async";
import { handleCtrlError } from "../utils/handle-error";
import { signupSchema } from "../zod-schema/auth.schema";

export var router = Router();

router.post(
  "/signup",
  validateResource(signupSchema),
  handleAsyncMiddleware(signupController),
  handleCtrlError
);
