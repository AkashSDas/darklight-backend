import { Router } from "express";
import passport from "passport";

import * as ctrl from "../controller/auth.controller";
import verifyAuth from "../middlewares/auth.middleware";
import { validateResource } from "../middlewares/zod.middleware";
import { Strategies } from "../passport";
import { handleMiddlewareError } from "../utils/async.util";
import { getEnv } from "../utils/config";
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

// Cancel oauth signup (post oauth signup)
router.delete(
  "/cancel-oauth",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.cancelOauthSignup),
  sendErrorResponse
);

// Complete OAuth signup (post oauth signup)
router.put(
  "/complete-oauth",
  validateResource(z.completeOauthSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.completeOauth),
  sendErrorResponse
);

// Google OAuth signup
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
      failureMessage: "Cannot signup with Google, please try again",
      successRedirect: getEnv().oauth.signupSuccessRedirectURL,
      failureRedirect: getEnv().oauth.signupFailureRedirectURL,
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
      failureMessage: "Cannot signup with Facebook, please try again",
      successRedirect: getEnv().oauth.signupSuccessRedirectURL,
      failureRedirect: getEnv().oauth.signupFailureRedirectURL,
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
      failureMessage: "Cannot signup up Twitter, please try again",
      successRedirect: getEnv().oauth.signupSuccessRedirectURL,
      failureRedirect: getEnv().oauth.signupFailureRedirectURL,
    }),
    function signupWithTwitterRedirect() {}
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

// Get new access token (email/password login)
router.get(
  "/access-token",
  handleMiddlewareError(ctrl.accessToken),
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
      failureMessage: "Cannot login with Google, please try again",
      successRedirect: getEnv().oauth.loginSuccessRedirectURL,
      failureRedirect: `${
        getEnv().oauth.signupFailureRedirectURL
      }?info=signup-invalid`,
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
      failureMessage: "Cannot login with Facebook, Please try again",
      successRedirect: getEnv().oauth.loginSuccessRedirectURL,
      failureRedirect: `${
        getEnv().oauth.signupFailureRedirectURL
      }?info=signup-invalid`,
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
      failureMessage: "Cannot login with Twitter, please try again",
      successRedirect: getEnv().oauth.loginSuccessRedirectURL,
      failureRedirect: `${
        getEnv().oauth.signupFailureRedirectURL
      }?info=signup-invalid`,
    }),
    function loginWithTwitterRedirect() {}
  );

// =====================================
// Verify email
// =====================================

router
  .post(
    "/verify-email",
    validateResource(z.verifyEmail),
    handleMiddlewareError(ctrl.verifyEmail),
    sendErrorResponse
  )
  .put(
    "/confirm-email/:token",
    validateResource(z.confirmEmail),
    handleMiddlewareError(ctrl.confirmEmail),
    sendErrorResponse
  );

// =====================================
// Forgot password
// =====================================

router
  .post(
    "/forgot-password",
    validateResource(z.forgotPassword),
    handleMiddlewareError(ctrl.forgotPassword),
    sendErrorResponse
  )
  .put(
    "/password-reset/:token",
    validateResource(z.passwordReset),
    handleMiddlewareError(ctrl.passwordReset),
    sendErrorResponse
  );

// =====================================
// Logout
// =====================================

// Logout
router.get("/logout", handleMiddlewareError(ctrl.logout), sendErrorResponse);
