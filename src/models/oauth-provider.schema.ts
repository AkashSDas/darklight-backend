import { prop } from "@typegoose/typegoose";

export enum AvailableOAuthProvider {
  GOOGLE = "google",
  TWITTER = "twitter",
  FACEBOOK = "facebook",
}

export class OAuthProviderSchema {
  @prop({ type: String, required: true })
  sid: string;

  @prop({ type: String, required: true, enum: AvailableOAuthProvider })
  provider: AvailableOAuthProvider;
}
