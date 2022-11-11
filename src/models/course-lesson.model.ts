import { SchemaTypes, Types } from "mongoose";

import { getModelForClass, prop, Severity } from "@typegoose/typegoose";

import { TAttachmentClass } from "./attachment.model";
import { EditorContentType, TEditorContentClass } from "./editor-content.model";
import { TQnaClass } from "./qna.model";
import { TVideoClass } from "./video.model";

/** Lesson Typegoose Class */
export class TCourseLessonClass {
  @prop({ type: SchemaTypes.String, trim: true })
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

  // ===============================
  // Methods
  // ===============================

  /** Add content at `addAt` position in the lesson's contents array */
  addContent(
    type: EditorContentType,
    addAt: number,
    data?: { [key: string]: any }[]
  ) {
    var content = new TEditorContentClass();
    content.type = type;
    console.log("data", data);
    if (data) content.data = data as any;
    this.contents.splice(addAt, 0, content);
  }

  updateLastEditedOn() {
    this.lastEditedOn = new Date(Date.now());
  }

  // TODO: check content type
  updateContent(updateAt: number, data: any) {
    // It wasn't saving the updated contents list when I was directly updating
    // the content data like this
    // this.contents[updateAt].data = new data;
    console.log(updateAt);
    var content = this.contents[updateAt];
    content.data = data as any;
    this.contents[updateAt] = content;
  }

  deleteContent(deleteAt: number) {
    this.contents.splice(deleteAt, 1);
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

export var CourseLessonModel = getModelForClass(TCourseLessonClass, {
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "course-lesson" },
});
