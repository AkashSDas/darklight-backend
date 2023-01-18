import passport from "passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

import { getUserService } from "../services/user.service";
import { getEnv } from "../utils/config";
import { Strategies } from "./";

async function verify(
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  next: VerifyCallback
) {
  var { email } = profile._json;
  var user = await getUserService({ email });

  // If the user doesn't exists OR the user exists but the signup process isn't
  // completed yet
  if (!user || (user && !user.username) || !user.email) {
    return next(null, null);
  }

  // Log the user in
  return next(null, user);
}

function googleLoginStrategy() {
  return new Strategy(
    {
      clientID: getEnv().oauth.google.clientID,
      clientSecret: getEnv().oauth.google.clientSecret,
      callbackURL: getEnv().oauth.google.loginCallbackURL,
    },
    verify
  );
}

passport.serializeUser(function serializeLoginUser(user, done) {
  done(null, (user as any)._id);
});

passport.deserializeUser(async function deserializeLoginUser(_id, done) {
  try {
    var user = await getUserService({ _id });
  } catch (err) {
    var error = err;
  }

  done(error, user);
});

passport.use(Strategies.GoogleLogin, googleLoginStrategy());
