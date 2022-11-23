import { Request } from "express";
import passport from "passport";
import { Profile, Strategy } from "passport-facebook";
import { Strategies } from ".";
import { BaseApiError } from "../utils/handle-error";
import { createUserService, getUserService } from "../_services/user.service";
import { OAuthProvider } from "../_utils/user.util";

/** Check if the user exists OR not. If not, create a new user else login the user. */
async function verify(
  _req: Request,
  _accessToken: string,
  _refreshToken: string,
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
      verified: email ? true : false,
      profileImage: { id: "facebook", URL: picture.data.url },
      active: email ? true : false,
      oauthProviders: [{ id: id, provider: OAuthProvider.FACEBOOK }],
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
