import { Router } from "express";

import * as ctrl from "../controllers/auth.controller";
import { validateResource } from "../middlewares/zod.middleware";
import { handleMiddlewareError } from "../utils/async";
import { sendErrorResponse } from "../utils/error";
import * as z from "../utils/zod";

export var router = Router();

// =====================================
// Signup
// =====================================

// Email/password signup
router.post(
  "/signup",
  validateResource(z.signup),
  handleMiddlewareError(ctrl.signup),
  sendErrorResponse
);

// =====================================
// Login
// =====================================

// Email/password login
router.post(
  "/login",
  validateResource(z.login),
  handleMiddlewareError(ctrl.login),
  sendErrorResponse
);
