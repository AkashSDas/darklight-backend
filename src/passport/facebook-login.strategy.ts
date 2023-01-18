import passport from "passport";
import { Profile, Strategy } from "passport-facebook";

import { AvailableOauthProvider } from "../models/oauth-provider.schema";
import { getUserService } from "../services/user.service";
import { getEnv } from "../utils/config";
import { Strategies } from "./";

async function verify(
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  next: Function
) {
  var { id } = profile._json;
  var user = await getUserService({
    oauthProviders: {
      $elemMatch: { sid: id, provider: AvailableOauthProvider.FACEBOOK },
    },
  });

  // If the user doesn't exists OR the user exists but the signup process isn't
  // completed yet
  if (!user || (user && !user.username) || !user.email) {
    return next(null, null);
  }

  // Login the user
  return next(null, user);
}

function facebookLoginStrategy() {
  return new Strategy(
    {
      clientID: getEnv().oauth.facebook.clientID,
      clientSecret: getEnv().oauth.facebook.clientSecret,
      callbackURL: getEnv().oauth.facebook.loginCallbackURL,
      profileFields: ["id", "first_name", "displayName", "photos", "email"],
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

passport.use(Strategies.FacebookLogin, facebookLoginStrategy());
