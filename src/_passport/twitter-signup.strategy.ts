import { Request } from "express";
import passport from "passport";
import { Profile, Strategy } from "passport-twitter";
import { Strategies } from ".";
import { createUserService, getUserService } from "../_services/user.service";
import { BaseApiError } from "../_utils/error.util";
import { OAuthProvider } from "../_utils/user.util";

async function verify(
  _req: Request,
  _accessToken: string,
  _refreshToken: string,
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
      verified: email ? true : false,
      profileImage: profile_image_url
        ? { id: "twitter", URL: profile_image_url }
        : null,
      active: email ? true : false,
      oauthProviders: [{ id: id, provider: OAuthProvider.TWITTER }],
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
      consumerKey: process.env.TWITTER_OAUTH_CLIENT_KEY,
      consumerSecret: process.env.TWITTER_OAUTH_CLIENT_KEY_SECRET,
      callbackURL: process.env.TWITTER_OAUTH_CALLBACK_URL,
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
