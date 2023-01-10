import { Router } from "express";
import { authenticate } from "passport";

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

// Google OAuth signup
router
  .get(
    "/signup/google",
    authenticate("google-signup", {
      scope: ["profile", "email"],
    }),
    function signupWithGoogle() {}
  )
  .get(
    "/signup/google/redirect",
    authenticate("google-signup", {
      failureMessage: "Cannot signup with Google, please try again",
      successRedirect: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
    })
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

// =====================================
// Others
// =====================================

// Logout
router.post("/logout", handleMiddlewareError(ctrl.logout), sendErrorResponse);
