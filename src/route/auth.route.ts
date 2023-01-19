import { Router } from "express";
import passport from "passport";

import * as ctrl from "../controller/auth.controller";
import verifyAuth from "../middlewares/auth.middleware";
import { validateResource } from "../middlewares/zod.middleware";
import { Strategies } from "../passport";
import * as z from "../schema/auth.schema";
import { handleMiddlewareError } from "../utils/async.util";
import { sendErrorResponse } from "../utils/error.util";

export var router = Router();

// ==================================
// SIGNUP ROUTES
// ==================================

// Email/password signup
router.post(
  "/signup",
  validateResource(z.signupSchema),
  handleMiddlewareError(ctrl.signupController),
  sendErrorResponse
);

// Cancel oauth signup (post oauth signup)
router.delete(
  "/cancel-oauth",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.cancelOAuthController),
  sendErrorResponse
);

// Complete OAuth signup (post oauth signup)
router.put(
  "/complete-oauth",
  validateResource(z.completeOAuthSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.completeOAuthController),
  sendErrorResponse
);

// Google OAuth signup
router
  .get(
    "/signup/google",
    passport.authenticate(Strategies.GoogleSignup, {
      scope: ["profile", "email"],
    }),
    function signupWithGoogle() { }
  )
  .get(
    "/signup/google/redirect",
    passport.authenticate(Strategies.GoogleSignup, {
      failureMessage: "Cannot signup with Google, please try again",
      successRedirect: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
    })
  );

// Facebook OAuth signup
router
  .get(
    "/signup/facebook",
    passport.authenticate(Strategies.FacebookSignup),
    function signupWithFacebook() { }
  )
  .get(
    "/signup/facebook/redirect",
    passport.authenticate(Strategies.FacebookSignup, {
      failureMessage: "Cannot signup with Facebook, please try again",
      successRedirect: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
    }),
    function signupWithFacebookRedirect() { }
  );

// Twitter OAuth signup
router
  .get(
    "/signup/twitter",
    passport.authenticate(Strategies.TwitterSignup),
    function signupWithTwitter() { }
  )
  .get(
    "/signup/twitter/redirect",
    passport.authenticate(Strategies.TwitterSignup, {
      failureMessage: "Cannot signup up Twitter, please try again",
      successRedirect: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
    }),
    function signupWithTwitterRedirect() { }
  );

// ==================================
// LOGIN ROUTES
// ==================================

// Email/password login
router.post(
  "/login",
  validateResource(z.loginSchema),
  handleMiddlewareError(ctrl.loginController),
  sendErrorResponse
);

// Get new access token (email/password login)
router.get(
  "/access-token",
  handleMiddlewareError(ctrl.accessTokenController),
  sendErrorResponse
);

// Goggle OAuth login
router
  .get(
    "/login/google",
    passport.authenticate(Strategies.GoogleLogin, {
      scope: ["profile", "email"],
    }),
    function loginWithGoogle() { }
  )
  .get(
    "/login/google/redirect",
    passport.authenticate(Strategies.GoogleLogin, {
      failureMessage: "Cannot login with Google, please try again",
      successRedirect: process.env.OAUTH_LOGIN_SUCCESS_REDIRECT_URL,
      failureRedirect: `${process.env.OAUTH_LOGIN_FAILURE_REDIRECT_URL}?info=signup-invalid`,
    }),
    function loginWithGoogleRedirect() { }
  );

// Facebook OAuth login
router
  .get(
    "/login/facebook",
    passport.authenticate(Strategies.FacebookLogin),
    function loginWithFacebook() { }
  )
  .get(
    "/login/facebook/redirect",
    passport.authenticate(Strategies.FacebookLogin, {
      failureMessage: "Cannot login with Facebook, Please try again",
      successRedirect: process.env.OAUTH_LOGIN_SUCCESS_REDIRECT_URL,
      failureRedirect: `${process.env.OAUTH_LOGIN_FAILURE_REDIRECT_URL}?info=signup-invalid`,
    }),
    function loginWithFacebookRedirect() { }
  );

// Twitter OAuth login
router
  .get(
    "/login/twitter",
    passport.authenticate(Strategies.TwitterLogin),
    function loginWithTwitter() { }
  )
  .get(
    "/login/twitter/redirect",
    passport.authenticate(Strategies.TwitterLogin, {
      failureMessage: "Cannot login with Twitter, please try again",
      successRedirect: process.env.OAUTH_LOGIN_SUCCESS_REDIRECT_URL,
      failureRedirect: `${process.env.OAUTH_LOGIN_FAILURE_REDIRECT_URL}?info=signup-invalid`,
    }),
    function loginWithTwitterRedirect() { }
  );

// ==================================
// EMAIL VERIFICATION ROUTES
// ==================================

router
  .post(
    "/verify-email",
    validateResource(z.verifyEmailSchema),
    handleMiddlewareError(ctrl.verifyEmailController),
    sendErrorResponse
  )
  .put(
    "/confirm-email/:token",
    validateResource(z.confirmEmailSchema),
    handleMiddlewareError(ctrl.confirmEmailController),
    sendErrorResponse
  );

// ==================================
// PASSWORD RESET ROUTES
// ==================================

router
  .post(
    "/forgot-password",
    validateResource(z.forgotPasswordSchema),
    handleMiddlewareError(ctrl.forgotPasswordController),
    sendErrorResponse
  )
  .put(
    "/password-reset/:token",
    validateResource(z.passwordResetSchema),
    handleMiddlewareError(ctrl.passwordResetController),
    sendErrorResponse
  );

// ==================================
// OTHER ROUTES
// ==================================

// Logout
router.get(
  "/logout",
  handleMiddlewareError(ctrl.logoutController),
  sendErrorResponse
);
