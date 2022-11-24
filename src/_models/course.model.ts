import { getModelForClass, prop, Ref, Severity } from "@typegoose/typegoose";
import mongoose, { SchemaTypes, Types } from "mongoose";
import { CourseDifficulty, CourseStage } from "../_utils/course.util";
import { ImageClass } from "./image.model";
import { LessonClass } from "./lesson.model";
import { UserClass } from "./user.model";

export class CourseClass {
  @prop({ type: SchemaTypes.String, trim: true })
  emoji?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, trim: true })
  title?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, trim: true })
  description?: string;

  @prop({ type: SchemaTypes.Date, default: Date.now, required: true })
  lastEditedOn: Date;

  @prop({
    type: SchemaTypes.String,
    required: true,
    enum: CourseStage,
    default: CourseStage.DRAFT,
  })
  stage: CourseStage;

  @prop({
    type: SchemaTypes.Array,
    ref: () => UserClass,
    required: true,
    default: [],
  })
  instructors: Ref<UserClass>[];

  @prop({ type: SchemaTypes.Number, min: 0 })
  price?: number;

  @prop({
    type: SchemaTypes.String,
    required: true,
    enum: CourseDifficulty,
    default: CourseDifficulty.BEGINNER,
  })
  difficulty: CourseDifficulty;

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  tags: string[];

  @prop({ type: () => ImageClass })
  coverImage: ImageClass;

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  groups: GroupClass[];

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  faqs: FaqClass[];

  @prop({ type: SchemaTypes.Number, required: true, min: 0, default: 0 })
  enrolled: number;

  @prop({
    type: SchemaTypes.Number,
    required: true,
    min: 0,
    max: 5,
    default: 0,
  })
  ratings: number;

  // ===============================
  // Virtuals
  // ===============================

  _id!: Types.ObjectId;
  /** Get transformed MongoDB `_id` */
  get id() {
    return this._id.toHexString();
  }
}

export var Course = getModelForClass(CourseClass, {
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "-course" },
});

class GroupClass {
  @prop({
    default: () => new mongoose.Types.ObjectId(),
    type: SchemaTypes.String,
    required: true,
    immutable: true,
  })
  _id: string;

  @prop({ type: SchemaTypes.String, trim: true })
  emoji?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, trim: true })
  title?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, trim: true })
  description?: string;

  @prop({
    ref: () => LessonClass,
    type: SchemaTypes.Array,
    required: true,
    default: [],
  })
  lessons: Ref<LessonClass>[];

  @prop({ type: SchemaTypes.Date, default: Date.now, required: true })
  lastEditedOn: Date;

  @prop({ type: SchemaTypes.Number, min: 0, default: 0, required: true })
  contentDuration: number;

  @prop({ type: SchemaTypes.Number, min: 0, default: 0, required: true })
  videoDuration: number;
}

class FaqClass {
  @prop({
    type: SchemaTypes.String,
    required: true,
    maxlength: 120,
    trim: true,
  })
  question: string;

  @prop({
    type: SchemaTypes.String,
    required: true,
    maxlength: 560,
    trim: true,
  })
  answer: string;
}
