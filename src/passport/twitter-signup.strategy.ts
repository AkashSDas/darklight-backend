import { Request } from "express";
import passport from "passport";
import { Profile, Strategy } from "passport-twitter";

import { AvailableOauthProvider } from "../models/oauth-provider.schema";
import { createUserService, getUserService } from "../services/user.service";
import { getEnv } from "../utils/config";
import { BaseApiError } from "../utils/error";
import { Strategies } from "./";

async function verify(
  _req: Request,
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  next: any
) {
  var { id, email } = profile._json;
  var user = await getUserService({
    oauthProviders: {
      $elemMatch: { id: id, provider: AvailableOauthProvider.TWITTER },
    },
  });
  if (user) return next(null, user); // login the user

  // Signup the user
  try {
    let newUser = await createUserService({
      email: email ?? undefined,
      verified: email ? true : false,
      // profileImage: profile_image_url
      //   ? { id: "twitter", URL: profile_image_url }
      //   : null,
      active: email ? true : false,
      oauthProviders: [{ sid: id, provider: AvailableOauthProvider.TWITTER }],
    });
    return next(null, newUser);
  } catch (error) {
    if (error instanceof Error || typeof error == "string") {
      return next(error, null);
    }

    throw new BaseApiError(500, "Internal Server Error");
  }
}

function twitterSignupStrategy() {
  return new Strategy(
    {
      consumerKey: getEnv().oauth.twitter.clientKey,
      consumerSecret: getEnv().oauth.twitter.clientKeySecret,
      callbackURL: getEnv().oauth.twitter.signupCallbackURL,
      passReqToCallback: true,
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

passport.use(Strategies.TwitterSignup, twitterSignupStrategy());
