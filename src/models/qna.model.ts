import { SchemaTypes } from "mongoose";

import { prop } from "@typegoose/typegoose";

import { TUserClass } from "./user.model";

/** Qna Reply Typegoose Class */
class TQnaReplyClass {
  @prop({ ref: () => TUserClass, required: true })
  user: TUserClass;

  @prop({ type: SchemaTypes.String, required: true })
  reply: string;

  /** Can be toogled by the author only */
  @prop({ type: SchemaTypes.Boolean, required: true, default: false })
  isAnswer: boolean;
}

/** Question and Answer Typegoose Class */
export class TQnaClass {
  @prop({ ref: () => TUserClass, required: true })
  user: TUserClass;

  @prop({ type: SchemaTypes.String, required: true })
  title: string;

  @prop({ type: SchemaTypes.String, required: true })
  description: string;

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  replies: TQnaReplyClass[];
}
