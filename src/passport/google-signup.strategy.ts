import { Request } from "express";
import passport from "passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

import { AvailableOauthProvider } from "../models/oauth-provider.schema";
import { createUserService, getUserService } from "../services/user.service";
import { getEnv } from "../utils/config";
import { BaseApiError } from "../utils/error";
import { Strategies } from "./";

// TODO: test this function
/** Check if the user exists OR not. If not, create a new user else login the user. */
async function verify(
  _req: Request,
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  next: VerifyCallback
) {
  var { email, sub, email_verified } = profile._json;
  var user = await getUserService({ email: email });

  // Login the user if the user already has an account
  if (user) return next(null, user);

  // Signup the user
  try {
    let verified =
      typeof email_verified == "boolean"
        ? email_verified
        : email_verified == "true"
        ? true
        : false;

    let newUser = await createUserService({
      email: email,
      verified,
      // profileImage: { id: "google", URL: picture },
      active: verified,
      oauthProviders: [{ sid: sub, provider: AvailableOauthProvider.GOOGLE }],
    });
    return next(null, newUser);
  } catch (error) {
    if (error instanceof Error || typeof error == "string") {
      return next(error, null);
    }

    throw new BaseApiError(500, "Internal Server Error");
  }
}

function googleSignupStrategy() {
  return new Strategy(
    {
      clientID: getEnv().oauth.google.clientID,
      clientSecret: getEnv().oauth.google.clientSecret,
      callbackURL: getEnv().oauth.google.signupCallbackURL,
      passReqToCallback: true,
    },
    verify
  );
}

passport.serializeUser(function serializeSignupUser(user, done) {
  done(null, (user as any)._id);
});

passport.deserializeUser(async function deserializeSignupUser(_id, done) {
  try {
    var user = await getUserService({ _id });
  } catch (err) {
    var error = err;
  }

  done(error, user);
});

passport.use(Strategies.GoogleSignup, googleSignupStrategy());
