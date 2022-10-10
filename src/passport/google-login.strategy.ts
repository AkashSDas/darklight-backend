import passport, { deserializeUser } from "passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";

import { getUserService } from "../services/user.service";
import { Strategies } from "./";

async function verify(
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  next: VerifyCallback
) {
  var { email } = profile._json;
  var user = await getUserService({ email });

  // Check if the signup process is remaining
  if (user && (!user.username || !user.email || !user.fullName)) {
    return next(null, null);
  }

  // Login the user
  return next(null, user);
}

function googleLoginStrategy() {
  return new Strategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL_FOR_LOGIN,
    },
    verify
  );
}

passport.serializeUser(function serializeUser(user, done) {
  done(null, (user as any)._id);
});
passport.deserializeUser(async function deserializeUser(_id, done) {
  try {
    var userData = await getUserService({ _id });
  } catch (err) {
    var error = err;
  }

  done(error, userData);
});

passport.use(Strategies.GoogleLogin, googleLoginStrategy());
