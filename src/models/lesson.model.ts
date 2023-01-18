import { SchemaTypes, Types } from "mongoose";

import { prop, Ref } from "@typegoose/typegoose";

import { AttachmentClass } from "./attachment.model";
import { ContentClass } from "./content.model";
import { CourseClass } from "./course.model";
import { ImageClass } from "./image.model";
import { QnaClass } from "./qna.model";
import { UserSchema } from "./user.schema";

export class LessonClass {
  @prop({ ref: () => CourseClass, required: true })
  course: Ref<CourseClass>;

  @prop({ type: () => SchemaTypes.ObjectId, required: true })
  group: Types.ObjectId;

  @prop({ type: SchemaTypes.Array, ref: () => UserSchema, required: true })
  instructors: Ref<UserSchema>[];

  @prop({ type: SchemaTypes.String, trim: true })
  emoji?: string;

  @prop({ type: SchemaTypes.String, trim: true, maxlength: 120 })
  title?: string;

  @prop({ type: () => SchemaTypes.Array, required: true, default: [] })
  content: ContentClass[];

  @prop({ type: () => ImageClass })
  video?: ImageClass | null;

  @prop({ type: SchemaTypes.Number, min: 0, default: 0, required: true })
  contentDuration: number;

  @prop({ type: SchemaTypes.Number, min: 0, default: 0, required: true })
  videoDuration: number;

  @prop({ type: SchemaTypes.Boolean, required: true, default: false })
  free: boolean;

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  qna: QnaClass[];

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  attachments: AttachmentClass[];

  @prop({ type: SchemaTypes.Date, required: true, default: Date.now })
  lastEditedOn: Date;

  // ===============================
  // Virtuals
  // ===============================

  _id!: Types.ObjectId;
  /** Get transformed MongoDB `_id` */
  get id() {
    return this._id.toHexString();
  }
}
