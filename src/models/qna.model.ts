import { SchemaTypes } from "mongoose";

import { prop } from "@typegoose/typegoose";

import { UserSchema } from "./user.schema";

class ReplyClass {
  @prop({ ref: () => UserSchema, required: true })
  user: UserSchema;

  @prop({ type: SchemaTypes.String, required: true })
  reply: string;

  /** Can be toggled by the author only */
  @prop({ type: SchemaTypes.Boolean, required: true, default: false })
  isAnswer: boolean;
}

export class QnaClass {
  @prop({ ref: () => UserSchema, required: true })
  user: UserSchema;

  @prop({
    type: SchemaTypes.String,
    required: true,
    maxlength: 120,
    trim: true,
  })
  title: string;

  @prop({
    type: SchemaTypes.String,
    required: true,
    maxlength: 120,
    trim: true,
  })
  description: string;

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  replies: ReplyClass[];
}
