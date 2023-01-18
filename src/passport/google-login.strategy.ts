import { config } from "dotenv";
import passport from "passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

import User from "../models/user.schema";

if (process.env.NODE_ENV != "production") config();

async function verify(
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  next: VerifyCallback
) {
  var { email } = profile._json;
  var user = await User.findOne({ email });

  // If the user doesn't exists OR the user exists but the signup process isn't completed yet
  if (!user || (user && !user.username) || (user && !user.email)) {
    return next(null, null);
  }

  // Log the user in
  return next(null, user);
}

function googleLoginStrategy() {
  return new Strategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_OAUTH_LOGIN_CALLBACK_URL,
    },
    verify
  );
}

passport.serializeUser(function serializeLoginUser(user, done) {
  done(null, (user as any)._id);
});

passport.deserializeUser(async function deserializeLoginUser(_id, done) {
  try {
    var user = await User.findOne({ _id });
  } catch (err) {
    var error = err;
  }

  done(error, user);
});

passport.use("google-login", googleLoginStrategy());
