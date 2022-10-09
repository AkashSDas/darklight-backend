import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { SchemaTypes, Types } from "mongoose";
import validator from "validator";

import { getModelForClass, modelOptions, post, pre, prop, Severity } from "@typegoose/typegoose";

import { BaseApiError } from "../utils/handle-error";
import { TImageClass } from "./image.model";

// ===============================
// Enums
// ===============================

export enum UserRole {
  STUDENT = "student",
  INSTRUCTOR = "instructor",
  ADMIN = "admin",
}

export enum OAuthProvider {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  TWITTER = "twitter",
}

// ===============================
// Models and Sub-documents
// ===============================

/** OAuthProvider Typegoose Class */
class TOAuthProviderClass {
  @prop({ type: SchemaTypes.String, required: true })
  id: string;

  @prop({ type: SchemaTypes.String, required: true, enum: OAuthProvider })
  provider: OAuthProvider;
}

/** User Typegoose Class */
@pre<TUserClass>("save", async function encryptPassword(next) {
  // If password is modified the hash it
  if (!this.isModified("passwordDigest")) return next();
  this.passwordDigest = await bcrypt.hash(this.passwordDigest, 12);
})
@post<TUserClass>("save", function handleDuplicateError(err, user, next) {
  // Handle error due to user trying to create user with duplicate
  // fields (email OR username)
  if (err.name == "MongoServerError" && err.code == 11000) {
    next(new BaseApiError(400, "Username OR email already used"));
  }
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "user" },
})
export class TUserClass {
  @prop({
    type: SchemaTypes.String,
    required: [true, "Full name is required"],
    maxlength: [240, "Max length can be 240 characters"],
    minlength: [6, "Minimum length should be 6 characters"],
    trim: true,
  })
  fullName: string;

  @prop({
    type: SchemaTypes.String,
    maxlength: [120, "Max length can be 120 characters"],
    minlength: [3, "Minimum length should be 3 characters"],
    unique: true,
    trim: true,
  })
  username?: string;

  @prop({
    type: SchemaTypes.String,
    validate: [validator.isEmail, "Email is invalid"],
    unique: true,
  })
  email?: string;

  @prop({
    type: SchemaTypes.Boolean,
    required: [true, "Account status is required"],
    default: false,
  })
  isActive: boolean;

  @prop({
    type: SchemaTypes.Boolean,
    required: [true, "Email verification status is required"],
    default: false,
  })
  isEmailVerified: boolean;

  @prop({ type: SchemaTypes.String, select: false })
  emailVerificationToken?: string | null;

  @prop({ type: SchemaTypes.Date, select: false })
  emailVerificationTokenExpiresAt?: Date | null;

  @prop({
    type: () => SchemaTypes.Array,
    required: [true, "Roles are required"],
    default: ["user"],
  })
  roles: UserRole[];

  @prop({ type: SchemaTypes.String, select: false })
  passwordDigest?: string;

  @prop({ type: SchemaTypes.String, select: false })
  passwordResetToken?: string | null;

  @prop({ type: SchemaTypes.Date, select: false })
  passwordResetTokenExpiresAt?: Date | null;

  @prop({ type: () => TImageClass })
  profileImage?: TImageClass | null;

  @prop({ type: () => SchemaTypes.Array, required: true, default: [] })
  oauthProviders: TOAuthProviderClass[];

  // ===============================
  // Instance methods
  // ===============================

  /**
   * @param pwd Password to be compared
   * @returns true if password matches, false otherwise
   */
  async verifyPassword(pwd: string): Promise<boolean> {
    return await bcrypt.compare(pwd, this.passwordDigest);
  }

  /**
   * Generate a random token, hash it, and then save the hashed token to the
   * user's document along with an expiration date to 10 mins.
   */
  getPasswordResetToken(): string {
    var token = crypto.randomBytes(20).toString("hex");
    this.passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    this.passwordResetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return token;
  }

  /**
   * Generate a random token, hash it, and then save the hashed token to the
   * user's document along with an expiration date to 10 mins.
   */
  getEmailVerificationToken(): string {
    var token = crypto.randomBytes(20).toString("hex");
    this.emailVerificationToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    this.emailVerificationTokenExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    return token;
  }

  /** Genereate access token for JWT authentication. Short duration */
  generateAccessToken(): string {
    var payload = { id: this._id, username: this.username, email: this.email };
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  /** Genereate refresh token for JWT authentication. Long duration */
  generateRefreshToken(): string {
    var payload = { id: this._id, username: this.username, email: this.email };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  // ===============================
  // Virtuals
  // ===============================

  _id!: Types.ObjectId;
  /** Get transformed MongoDB `_id` */
  get id() {
    return this._id.toHexString();
  }
}

/** User Typegoose Model */
export var UserModel = getModelForClass(TUserClass);
