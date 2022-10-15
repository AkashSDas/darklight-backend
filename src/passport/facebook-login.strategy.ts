import passport from "passport";
import { Profile, Strategy } from "passport-facebook";

import { OAuthProvider } from "../models/user.model";
import { getUserService } from "../services/user.service";
import { Strategies } from "./";

/** Check if the user exists OR not. If not, create a new user else login the user. */
async function verify(
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  next: any
) {
  var { id } = profile._json;
  var user = await getUserService({
    oauthProviders: { $elemMatch: { id, provider: OAuthProvider.FACEBOOK } },
  });

  // If the user doesn't exists OR the user exists but the signup process isn't
  // completed yet
  if (!user || (user && !user.username) || !user.email || !user.fullName) {
    return next(null, null);
  }

  // Login the user
  return next(null, user);
}

function facebookLoginStrategy() {
  return new Strategy(
    {
      clientID: process.env.FACEBOOK_OAUTH_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_OAUTH_CALLBACK_URL_FOR_LOGIN,
      profileFields: ["id", "first_name", "displayName", "photos", "email"],
    },
    verify
  );
}

passport.serializeUser(function serializeFacebookUser(user, done) {
  done(null, (user as any)._id);
});
passport.deserializeUser(async function deserializeFacebookUser(_id, done) {
  try {
    var userData = await getUserService({ _id });
  } catch (err) {
    var error = err;
  }

  done(error, userData);
});

passport.use(Strategies.FacebookLogin, facebookLoginStrategy());
