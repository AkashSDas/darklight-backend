import { config } from "dotenv";

if (process.env.NODE_ENV != "production") config();

/** Get environment variables */
export function getEnv() {
  return {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    port: process.env.PORT || 8000,
    frontendURL: process.env.FRONTEND_URL,
    backendURL: process.env.BACKEND_URL,
    env: process.env.NODE_ENV as "development" | "production" | "test",
    mongodbURL: process.env.MONGODB_CONNECT_URL,
    cookieSessionSecret: process.env.COOKIE_SESSION_SECRET,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    refreshTokenExpiresInMs: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_MS),
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 0,
      username: process.env.SMTP_USERNAME,
      password: process.env.SMTP_PASSWORD,
      fromEmail: process.env.FROM_EMAIL,
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_SECRET_KEY,
    },
    oauth: {
      google: {
        clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        signupCallbackURL: process.env.GOOGLE_OAUTH_SIGNUP_CALLBACK_URL,
        loginCallbackURL: process.env.GOOGLE_OAUTH_LOGIN_CALLBACK_URL,
      },
      facebook: {
        clientID: process.env.FACEBOOK_OAUTH_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET,
        signupCallbackURL: process.env.FACEBOOK_OAUTH_SIGNUP_CALLBACK_URL,
        loginCallbackURL: process.env.FACEBOOK_OAUTH_LOGIN_CALLBACK_URL,
      },
      twitter: {
        clientKey: process.env.TWITTER_OAUTH_CLIENT_KEY,
        clientKeySecret: process.env.TWITTER_OAUTH_CLIENT_KEY_SECRET,
        signupCallbackURL: process.env.TWITTER_OAUTH_SIGNUP_CALLBACK_URL,
        loginCallbackURL: process.env.TWITTER_OAUTH_LOGIN_CALLBACK_URL,
      },
      signupSuccessRedirectURL: process.env.OAUTH_SIGNUP_SUCCESS_REDIRECT_URL,
      signupFailureRedirectURL: process.env.OAUTH_SIGNUP_FAILURE_REDIRECT_URL,
      loginSuccessRedirectURL: process.env.OAUTH_LOGIN_SUCCESS_REDIRECT_URL,
      loginFailureRedirectURL: process.env.OAUTH_LOGIN_FAILURE_REDIRECT_URL,
    },
  };
}
