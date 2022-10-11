import { SchemaTypes } from "mongoose";

import { getModelForClass, prop, Severity } from "@typegoose/typegoose";

import { TAttachmentClass } from "./attachment.model";
import { TEditorContentClass } from "./editor-content.model";
import { TQnaClass } from "./qna.model";
import { TVideoClass } from "./video.model";

/** Lesson Typegoose Class */
class TCourseLessonClass {
  @prop({ type: SchemaTypes.String, maxlength: 1, minlength: 1, trim: true })
  emoji?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, minlength: 3, trim: true })
  title?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, minlength: 3, trim: true })
  description?: string;

  @prop({ type: () => TVideoClass })
  video?: TVideoClass | null;

  @prop({ type: () => SchemaTypes.Array })
  contents: TEditorContentClass[];

  @prop({ type: SchemaTypes.Date, required: true, default: Date.now })
  lastEditedOn: Date;

  @prop({ type: SchemaTypes.Boolean, required: true, default: false })
  isFree: boolean;

  @prop({ type: () => SchemaTypes.Array, required: true, default: [] })
  qna: TQnaClass[];

  @prop({ type: () => SchemaTypes.Array, required: true, default: [] })
  attachments: TAttachmentClass[];
}

export var TLesson = getModelForClass(TCourseLessonClass, {
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "courseLesson" },
});
