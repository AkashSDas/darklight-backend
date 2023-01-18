export enum Strategies {
  GoogleSignup = "google-signup",
  GoogleLogin = "google-login",
  FacebookSignup = "facebook-signup",
  FacebookLogin = "facebook-login",
  TwitterSignup = "twitter-signup",
  TwitterLogin = "twitter-login",
}

export * from "./facebook-login.strategy";
export * from "./facebook-signup.strategy";
export * from "./google-login.strategy";
export * from "./google-signup.strategy";
export * from "./twitter-login.strategy";
export * from "./twitter-signup.strategy";
