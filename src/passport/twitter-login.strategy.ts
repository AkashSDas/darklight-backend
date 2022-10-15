import passport from "passport";
import { Profile, Strategy } from "passport-twitter";

import { OAuthProvider } from "../models/user.model";
import { getUserService } from "../services/user.service";
import { Strategies } from "./";

async function verify(
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  next: any
) {
  var { id } = profile._json;
  var user = await getUserService({
    oauthProviders: { $elemMatch: { id: id, provider: OAuthProvider.TWITTER } },
  });

  // If the user doesn't exists OR the user exists but the signup process isn't
  // completed yet
  if (!user || (user && !user.username) || !user.email || !user.fullName) {
    return next(null, null);
  }

  // Login the user
  return next(null, user);
}

function twitterLoginStrategy() {
  return new Strategy(
    {
      consumerKey: process.env.TWITTER_OAUTH_CLIENT_KEY,
      consumerSecret: process.env.TWITTER_OAUTH_CLIENT_KEY_SECRET,
      callbackURL: process.env.TWITTER_OAUTH_CALLBACK_URL_FOR_LOGIN,
      includeEmail: true,
    },
    verify
  );
}

passport.serializeUser(function serializeTwitterUser(user, done) {
  done(null, (user as any)._id);
});
passport.deserializeUser(async function deserializeTwitterUser(_id, done) {
  try {
    var userData = await getUserService({ _id });
  } catch (err) {
    var error = err;
  }

  done(error, userData);
});

passport.use(Strategies.TwitterLogin, twitterLoginStrategy());
