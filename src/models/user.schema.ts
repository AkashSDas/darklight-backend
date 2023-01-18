import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { SchemaTypes, Types } from "mongoose";
import { generate } from "randomstring";
import isEmail from "validator/lib/isEmail";

import { getModelForClass, modelOptions, post, pre, prop, Ref, Severity } from "@typegoose/typegoose";

import { BaseApiError } from "../utils/error";
import { UserRole } from "../utils/user";
import { EnrolledCourseClass } from "./enrolled-course.model";
import { OauthProviderSchema } from "./oauth-provider.schema";

// TODO: update enrolledCourses field
/**
 * @remark Since fields like email/username could be null,
 * the unique flag is not set on them
 */
@pre<UserSchema>("save", preMongooseSave)
@post<UserSchema>("save", handleDuplicateError)
@pre<UserSchema>("findOneAndUpdate", changeUserInfo)
@post<UserSchema>("findOneAndUpdate", handleDuplicateError)
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW, customName: "user" },
})
export class UserSchema {
  // =====================================
  // Fields
  // =====================================

  _id!: Types.ObjectId;

  @prop({ type: String, trim: true, maxlength: 24, minlength: 4 })
  username?: string;

  @prop({ type: String, validate: [isEmail, "Invalid email"] })
  email?: string;

  /** Users signed up with OAuth won't have a password */
  @prop({ type: String, select: false })
  passwordDigest?: string;

  @prop({ type: String, select: false })
  passwordResetToken?: string;

  @prop({
    type: Date,
    select: false,
    validate: [{ validator: dateShouldBeInFuture, message: "Invalid date" }],
  })
  passwordResetTokenExpiresAt?: Date;

  /** Is account active OR not */
  @prop({ type: Boolean, required: true, default: false })
  active: boolean;

  @prop({ type: Boolean, required: true, default: false })
  banned: boolean;

  @prop({ type: Boolean, required: true, default: false })
  verified: boolean;

  @prop({ type: String, select: false })
  verificationToken?: string;

  @prop({
    type: Date,
    select: false,
    validate: [{ validator: dateShouldBeInFuture, message: "Invalid date" }],
  })
  verificationTokenExpiresAt?: Date;

  @prop({ type: () => SchemaTypes.Array, required: true, default: [] })
  oauthProviders: OauthProviderSchema[];

  @prop({
    type: () => SchemaTypes.Array,
    required: true,
    default: [UserRole.BASE],
  })
  roles: UserRole[];

  @prop({
    type: String,
    required: true,
    default: function createId() {
      var id = generate({ length: 16 });
      id = "acc_" + id;
      return id;
    },
  })
  userId: string;

  @prop({ type: String, select: false })
  stripeCustomerId?: string;

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  enrolledCourses: Ref<EnrolledCourseClass>[];

  // =====================================
  // Instance Methods
  // =====================================

  /**
   * @param pwd Password to be compared
   * @returns true if password matches, false otherwise
   */
  async verifyPassword(pwd: string): Promise<boolean> {
    return await bcrypt.compare(pwd, this.passwordDigest);
  }

  /**
   * Generate a random token, hash it and set it as password reset token
   * along with its expiry date.
   *
   * @returns the generated token
   */
  generatePasswordResetToken(): string {
    var token = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 5m
    this.passwordResetTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return token;
  }

  /**
   * Generate a random token, hash it and set it as verification token
   * along with its expiry date.
   *
   * @returns the generated token
   */
  generateVerificationToken(): string {
    var token = crypto.randomBytes(32).toString("hex");

    this.verificationToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 5m
    this.verificationTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    return token;
  }

  /** Genereate access token for JWT authentication. Short duration */
  getAccessToken(): string {
    var payload = { _id: this._id, email: this.email };
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /** Genereate refresh token for JWT authentication. Long duration */
  getRefreshToken(): string {
    var payload = { _id: this._id, email: this.email };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });
  }
}

/** User Typegoose Model */
var User = getModelForClass(UserSchema);
export default User;

// =====================================
// Hooks
// =====================================

async function preMongooseSave(this: any, next: any) {
  // If password is modified then hash it
  if (this.isModified("passwordDigest")) {
    this.passwordDigest = await bcrypt.hash(this.passwordDigest, 12);
  }

  // Validate email and username uniqueness
  if (this.isModified("email") || this.isModified("username")) {
    let query = [];
    if (this.isModified("email")) query.push({ email: this.email });
    if (this.isModified("username")) query.push({ username: this.username });

    let exists = await User.exists({ $or: query });
    if (exists?._id && !exists._id.equals(this._id)) {
      return next(new Error("Duplicate user"));
    }
  }

  return next();
}

function handleDuplicateError(err: any, user: any, next: any) {
  // Handle error due to violation of unique fields
  if (err instanceof Error && err.message == "Duplicate user") {
    return next(new BaseApiError(400, "User already exists"));
  } else if (err.name == "MongoError" && err.code == 11000) {
    return next(new BaseApiError(400, "Duplicate fields"));
  }

  return next();
}

async function changeUserInfo(this: any, next: any) {
  var user = this.getQuery();
  var update = this.getUpdate() as any;

  // If password is modified then hash it
  if (update.passwordDigest) {
    update.passwordDigest = await bcrypt.hash(update.passwordDigest, 12);
  }

  // Validate email & username uniqueness
  if (update.email || update.username) {
    let query = [];
    if (update.email) query.push({ email: update.email });
    if (update.username) query.push({ username: update.username });

    let exists = await User.exists({ $or: query });
    if (exists?._id && !exists._id.equals(user._id)) {
      return next(new Error("Duplicate user"));
    }
  }

  return next();
}

// =====================================
// Utilities
// =====================================

export function dateShouldBeInFuture(v: Date) {
  return v > new Date(Date.now());
}
