import passport from "passport";
import { Profile, Strategy } from "passport-twitter";

import { getUserService } from "../services/user.service";
import { OAuthProvider } from "../utils/user";
import { Strategies } from "./";

async function verify(
  _accessToken: string,
  _refreshToken: string,
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

passport.use(Strategies.TwitterLogin, twitterLoginStrategy());
