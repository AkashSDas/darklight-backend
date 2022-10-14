import { Request } from "express";
import passport from "passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

import { OAuthProvider } from "../models/user.model";
import { createUserService, getUserService } from "../services/user.service";
import { Strategies } from "./";

/** Check if the user exists OR not. If not, create a new user else login the user. */
async function verify(
  req: Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  next: VerifyCallback
) {
  var { email, sub, email_verified, picture } = profile._json;
  var user = await getUserService({ email: email });
  if (user) return next(null, user); // login the user

  // Signup the user
  try {
    let isEmailVerified =
      typeof email_verified == "boolean"
        ? email_verified
        : email_verified == "true"
        ? true
        : false;

    let newUser = await createUserService({
      fullName: profile.displayName,
      email: email,
      isEmailVerified,
      profileImage: { id: "google", URL: picture },
      isActive: isEmailVerified,
      oauthProviders: [{ id: sub, provider: OAuthProvider.GOOGLE }],
    });
    return next(null, newUser);
  } catch (error) {
    return next(error as any, null);
  }
}

function googleSignupStrategy() {
  return new Strategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL,
      passReqToCallback: true,
    },
    verify
  );
}

passport.serializeUser(function serializeGoogleUser(user, done) {
  done(null, (user as any)._id);
});
passport.deserializeUser(async function deserializeGoogleUser(_id, done) {
  try {
    var userData = await getUserService({ _id });
  } catch (err) {
    var error = err;
  }

  done(error, userData);
});

passport.use(Strategies.GoogleSignup, googleSignupStrategy());
