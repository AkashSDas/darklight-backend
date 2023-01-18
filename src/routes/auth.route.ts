import { Router } from "express";
import passport from "passport";

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
    passport.authenticate("google-signup", {
      scope: ["profile", "email"],
    }),
    function signupWithGoogle() {}
  )
  .get(
    "/signup/google/redirect",
    passport.authenticate("google-signup", {
      failureMessage: "Cannot signup with Google, please try again",
      successRedirect: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
    }),
    function signupWithGoogleRedirect() {}
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

// Google OAuth login
router
  .get(
    "/login/google",
    passport.authenticate("google-login", {
      scope: ["profile", "email"],
    }),
    function loginWithGoogle() {}
  )
  .get(
    "/login/google/redirect",
    passport.authenticate("google-login", {
      failureMessage: "Cannot login with Google, please try again",
      successRedirect: process.env.OAUTH_LOGIN_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_LOGIN_FAILURE_REDIRECT_URL,
    }),
    function loginWithGoogleRedirect() {}
  );

// =====================================
// Others
// =====================================

// Logout
router.post("/logout", handleMiddlewareError(ctrl.logout), sendErrorResponse);
