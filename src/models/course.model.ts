import { SchemaTypes, Types } from "mongoose";

import { getModelForClass, prop, Ref, Severity } from "@typegoose/typegoose";

import { TCourseLessonClass } from "./course-lesson.model";
import { TImageClass } from "./image.model";
import { TUserClass } from "./user.model";

// ===============================
// Enums
// ===============================

export enum CourseLifecycleStage {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export enum CourseCourseDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

// ===============================
// Models and Sub-documents
// ===============================

/** Faq Typegoose Class */
class TFaqClass {
  @prop({ type: SchemaTypes.String, maxlength: 120, minlength: 3, trim: true })
  question: string;

  @prop({ type: SchemaTypes.String, maxlength: 526, minlength: 3, trim: true })
  answer: string;
}

class TCourseModuleClass {
  @prop({ type: SchemaTypes.String, maxlength: 1, minlength: 1, trim: true })
  emoji?: string;

  @prop({
    ref: () => TCourseLessonClass,
    type: SchemaTypes.Array,
    required: true,
    default: [],
  })
  lessons: Ref<TCourseLessonClass>[];
}

/** Course Typegoose Class */
export class TCourseClass {
  @prop({ type: SchemaTypes.String, maxlength: 120, minlength: 6 })
  title?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, minlength: 6 })
  description?: string;

  @prop({ type: SchemaTypes.Date, default: Date.now, required: true })
  lastEditedOn: Date;

  @prop({
    type: SchemaTypes.String,
    required: true,
    enum: CourseLifecycleStage,
    default: CourseLifecycleStage.DRAFT,
  })
  stage: CourseLifecycleStage;

  @prop({
    type: SchemaTypes.Array,
    ref: () => TUserClass,
    required: true,
    default: [],
  })
  instructors: Ref<TUserClass>[];

  @prop({ type: SchemaTypes.Number, min: 0, required: true })
  price?: number;

  @prop({
    type: SchemaTypes.String,
    required: true,
    enum: CourseCourseDifficulty,
    default: CourseCourseDifficulty.BEGINNER,
  })
  difficulty: CourseCourseDifficulty;

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  tags: string[];

  @prop({ type: () => TImageClass })
  coverImage: TImageClass;

  @prop({
    ref: () => TCourseModuleClass,
    type: SchemaTypes.Array,
    required: true,
    default: [],
  })
  modules: TCourseModuleClass[];

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  faqs: TFaqClass[];

  // ===============================
  // Methods
  // ===============================

  updateLastEditedOn() {
    this.lastEditedOn = new Date(Date.now());
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

export var CourseModel = getModelForClass(TCourseClass, {
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "course" },
});
