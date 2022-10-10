import { Request } from "express";
import passport from "passport";
import { Profile, Strategy } from "passport-facebook";

import { OAuthProvider } from "../models/user.model";
import { createUserService, getUserService } from "../services/user.service";
import { Strategies } from "./";

/** Check if the user exists OR not. If not, create a new user else login the user. */
async function verify(
  req: Request,
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  next: any
) {
  var { email, id, name, picture } = profile._json;
  var user = await getUserService({ email: email });
  if (user) return next(null, user); // login the user

  // Signup the user
  try {
    let newUser = await createUserService({
      fullName: name,
      email: email ?? undefined,
      isEmailVerified: email ? true : false,
      profileImage: { id: "facebook", URL: picture.data.url },
      isActive: email ? true : false,
      oauthProviders: [{ id: id, provider: OAuthProvider.FACEBOOK }],
    });
    return next(null, newUser);
  } catch (error) {
    return next(error as any, null);
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

passport.use(Strategies.FacebookSignup, facebookSignupStrategy());
