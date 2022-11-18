import { Router } from "express";
import passport from "passport";

import * as authCtrl from "../controller/auth.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import { Strategies } from "../passport";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import * as schema from "../zod-schema/auth.schema";

export var router = Router();

// ==================================
// SIGNUP ROUTES
// ==================================

// Email/password signup
router.post(
  "/signup",
  validateResource(schema.signupSchema),
  handleMiddlewarelError(authCtrl.signupController),
  sendErrorResponse
);

// Cancel oauth signup (post oauth signup)
router.post(
  "/cancel-oauth",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(authCtrl.cancelOAuthController),
  sendErrorResponse
);

// Complete OAuth signup (post oauth signup)
router.post(
  "/complete-oauth",
  validateResource(schema.completeOAuthSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(authCtrl.completeOAuthController),
  sendErrorResponse
);

// Goggle OAuth signup
router
  .get(
    "/signup/google",
    passport.authenticate(Strategies.GoogleSignup, {
      scope: ["profile", "email"],
    }),
    function signupWithGoogle() {}
  )
  .get(
    "/signup/google/redirect",
    passport.authenticate(Strategies.GoogleSignup, {
      failureMessage: "Cannot signup to Google, Please try again",
      successRedirect: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
    })
  );

// Facebook OAuth signup
router
  .get(
    "/signup/facebook",
    passport.authenticate(Strategies.FacebookSignup),
    function signupWithFacebook() {}
  )
  .get(
    "/signup/facebook/redirect",
    passport.authenticate(Strategies.FacebookSignup, {
      failureMessage: "Cannot signup to Facebook, Please try again",
      successRedirect: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
    }),
    function signupWithFacebookRedirect() {}
  );

// Twitter OAuth signup
router
  .get(
    "/signup/twitter",
    passport.authenticate(Strategies.TwitterSignup),
    function signupWithTwitter() {}
  )
  .get(
    "/signup/twitter/redirect",
    passport.authenticate(Strategies.TwitterSignup, {
      failureMessage: "Cannot signup to Twitter, Please try again",
      successRedirect: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      failureRedirect: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
    }),
    function signupWithTwitterRedirect() {}
  );

// ==================================
// LOGIN ROUTES
// ==================================

// Email/password login
router.post(
  "/login",
  validateResource(schema.loginSchema),
  handleMiddlewarelError(authCtrl.loginController),
  sendErrorResponse
);

// Get new access token (email/password login)
router.get(
  "/access-token",
  handleMiddlewarelError(authCtrl.accessTokenController),
  sendErrorResponse
);

// Goggle OAuth login
router
  .get(
    "/login/google",
    passport.authenticate(Strategies.GoogleLogin, {
      scope: ["profile", "email"],
    }),
    function loginWithGoogle() {}
  )
  .get(
    "/login/google/redirect",
    passport.authenticate(Strategies.GoogleLogin, {
      failureMessage: "Cannot login to Google, Please try again",
      successRedirect: process.env.OAUTH_LOGIN_SUCCESS_REDIRECT_URL,
      failureRedirect: `${process.env.OAUTH_LOGIN_FAILURE_REDIRECT_URL}?info=signup-invalid`,
    }),
    function loginWithGoogleRedirect() {}
  );

// Facebook OAuth login
router
  .get(
    "/login/facebook",
    passport.authenticate(Strategies.FacebookLogin),
    function loginWithFacebook() {}
  )
  .get(
    "/login/facebook/redirect",
    passport.authenticate(Strategies.FacebookLogin, {
      failureMessage: "Cannot login to Facebook, Please try again",
      successRedirect: process.env.OAUTH_LOGIN_SUCCESS_REDIRECT_URL,
      failureRedirect: `${process.env.OAUTH_LOGIN_FAILURE_REDIRECT_URL}?info=signup-invalid`,
    }),
    function loginWithFacebookRedirect() {}
  );

// Twitter OAuth login
router
  .get(
    "/login/twitter",
    passport.authenticate(Strategies.TwitterLogin),
    function loginWithTwitter() {}
  )
  .get(
    "/login/twitter/redirect",
    passport.authenticate(Strategies.TwitterLogin, {
      failureMessage: "Cannot login to Twitter, Please try again",
      successRedirect: process.env.OAUTH_LOGIN_SUCCESS_REDIRECT_URL,
      failureRedirect: `${process.env.OAUTH_LOGIN_FAILURE_REDIRECT_URL}?info=signup-invalid`,
    }),
    function loginWithTwitterRedirect() {}
  );

// ==================================
// EMAIL VERIFICATION ROUTES
// ==================================

router
  .post(
    "/verify-email",
    validateResource(schema.verifyEmailSchema),
    handleMiddlewarelError(authCtrl.verifyEmailController),
    sendErrorResponse
  )
  .get(
    "/confirm-email/:token",
    validateResource(schema.confirmEmailVerificationSchema),
    handleMiddlewarelError(authCtrl.confirmEmailVerificationController),
    sendErrorResponse
  );

// ==================================
// PASSWORD RESET ROUTES
// ==================================

router
  .post(
    "/forgot-password",
    validateResource(schema.forgotPasswordSchema),
    handleMiddlewarelError(authCtrl.forgotPasswordController),
    sendErrorResponse
  )
  .post(
    "/reset-password/:token",
    validateResource(schema.resetPasswordSchema),
    handleMiddlewarelError(authCtrl.resetPasswordController),
    sendErrorResponse
  );

// ==================================
// OTHER ROUTES
// ==================================

// Test auth
router.get(
  "/test",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(authCtrl.testAuthController),
  sendErrorResponse
);

// Logout
router.post(
  "/logout",
  handleMiddlewarelError(authCtrl.logoutController),
  sendErrorResponse
);
