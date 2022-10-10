import { Request } from "express";
import passport from "passport";
import { Profile, Strategy } from "passport-twitter";

import { OAuthProvider } from "../models/user.model";
import { createUserService, getUserService } from "../services/user.service";
import { Strategies } from "./";

async function verify(
  req: Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  next: any
) {
  var { id, name, email, profile_image_url } = profile._json;
  var user = await getUserService({ email: email });
  if (user) return next(null, user); // login the user

  // Signup the user
  try {
    let newUser = await createUserService({
      fullName: name,
      email: email ?? undefined,
      isEmailVerified: email ? true : false,
      profileImage: profile_image_url
        ? { id: "twitter", URL: profile_image_url }
        : null,
      isActive: email ? true : false,
      oauthProviders: [{ id: id, provider: OAuthProvider.TWITTER }],
    });
    return next(null, newUser);
  } catch (error) {
    return next(error as any, null);
  }
}

function twitterSignupStrategy() {
  return new Strategy(
    {
      consumerKey: process.env.TWITTER_OAUTH_CLIENT_KEY,
      consumerSecret: process.env.TWITTER_OAUTH_CLIENT_KEY_SECRET,
      callbackURL: process.env.TWITTER_OAUTH_CALLBACK_URL,
      passReqToCallback: true,
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

passport.use(Strategies.TwitterSignup, twitterSignupStrategy());
