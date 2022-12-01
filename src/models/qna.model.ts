import { prop } from "@typegoose/typegoose";
import { SchemaTypes } from "mongoose";
import { UserClass } from "./user.model";

class ReplyClass {
  @prop({ ref: () => UserClass, required: true })
  user: UserClass;

  @prop({ type: SchemaTypes.String, required: true })
  reply: string;

  /** Can be toggled by the author only */
  @prop({ type: SchemaTypes.Boolean, required: true, default: false })
  isAnswer: boolean;
}

export class QnaClass {
  @prop({ ref: () => UserClass, required: true })
  user: UserClass;

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
