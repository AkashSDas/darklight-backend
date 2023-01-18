import { Request } from "express";
import passport from "passport";
import { Profile, Strategy } from "passport-facebook";

import { AvailableOauthProvider } from "../models/oauth-provider.schema";
import { createUserService, getUserService } from "../services/user.service";
import { BaseApiError } from "../utils/error";
import { Strategies } from "./";

/** Check if the user exists OR not. If not, create a new user else login the user. */
async function verify(
  _req: Request,
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  next: any
) {
  var { email, id } = profile._json;
  var user = await getUserService({
    oauthProviders: {
      $elemMatch: { id, provider: AvailableOauthProvider.FACEBOOK },
    },
  });
  if (user) return next(null, user); // login the user

  // Signup the user
  try {
    let newUser = await createUserService({
      email: email ?? undefined,
      verified: email ? true : false,
      // profileImage: { id: "facebook", URL: picture.data.url },
      active: email ? true : false,
      oauthProviders: [{ sid: id, provider: AvailableOauthProvider.FACEBOOK }],
    });
    return next(null, newUser);
  } catch (error) {
    if (error instanceof Error || typeof error == "string") {
      return next(error, null);
    }

    throw new BaseApiError(500, "Internal Server Error");
  }
}

function facebookSignupStrategy() {
  return new Strategy(
    {
      clientID: process.env.FACEBOOK_OAUTH_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_OAUTH_CALLBACK_URL,
      profileFields: ["id", "first_name", "displayName", "photos", "email"],
      passReqToCallback: true,
    },
    verify
  );
}

passport.serializeUser(function serializeSignupUser(user, done) {
  done(null, (user as any)._id);
});

passport.deserializeUser(async function deserializeSignupUser(_id, done) {
  try {
    var user = await getUserService({ _id });
  } catch (err) {
    var error = err;
  }

  done(error, user);
});

passport.use(Strategies.FacebookSignup, facebookSignupStrategy());
