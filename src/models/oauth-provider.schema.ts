import { prop } from "@typegoose/typegoose";

export enum AvailableOauthProvider {
  GOOGLE = "google",
  TWITTER = "twitter",
  FACEBOOK = "facebook",
}

export class OauthProviderSchema {
  @prop({ type: String, required: true })
  sid: string;

  @prop({ type: String, required: true, enum: AvailableOauthProvider })
  provider: AvailableOauthProvider;
}
