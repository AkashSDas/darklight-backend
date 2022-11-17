import MongoPaging from "mongo-cursor-pagination";
import mongoose, { SchemaTypes, Types } from "mongoose";
import { nanoid } from "nanoid";

import { getModelForClass, plugin, prop, Ref, Severity } from "@typegoose/typegoose";

import { BaseApiError } from "../utils/handle-error";
import { TCourseLessonClass } from "./course-lesson.model";
import { TImageClass } from "./image.model";
import { TUserClass } from "./user.model";

// ========================
// UTILS
// ========================

export interface CourseMetadata {
  emoji?: string;
  title?: string;
  description?: string;
  difficulty?: CourseCourseDifficulty;
  price?: number;
  stage?: CourseLifecycleStage;
  tags: string[];
}

export interface ModuleMetadata {
  emoji?: string;
  title?: string;
  description?: string;
  lessons: Types.ObjectId[];
}

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

export class TCourseModuleClass {
  @prop({
    default: () => nanoid(24),
    type: SchemaTypes.String,
    immutable: true,
    required: true,
  })
  id: string;

  @prop({ type: SchemaTypes.String, maxlength: 1, trim: true })
  emoji?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, trim: true })
  title?: string;

  @prop({ type: SchemaTypes.String, maxlength: 120, trim: true })
  description?: string;

  @prop({
    ref: () => TCourseLessonClass,
    type: SchemaTypes.Array,
    required: true,
    default: [],
  })
  lessons: Ref<TCourseLessonClass>[];

  @prop({ type: SchemaTypes.Date, default: Date.now, required: true })
  lastEditedOn: Date;
}

/** Course Typegoose Class */
@plugin(MongoPaging.mongoosePlugin, { name: "paginateCourse" })
export class TCourseClass {
  @prop({ type: SchemaTypes.String })
  emoji?: string;

  @prop({ type: SchemaTypes.String })
  title?: string;

  @prop({ type: SchemaTypes.String })
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

  @prop({ type: SchemaTypes.Number, min: 0 })
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

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  modules: TCourseModuleClass[];

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  faqs: TFaqClass[];

  // =====================
  // METHODS
  // =====================

  // COURSE RELATED

  updateLastEditedOn(): void {
    this.lastEditedOn = new Date(Date.now());
  }

  updateMetadata(payload: CourseMetadata): void {
    this.emoji = payload.emoji;
    this.title = payload.title;
    this.description = payload.description;
    this.price = payload.price;
    this.difficulty = payload.difficulty;
    this.tags = payload.tags;
    this.stage = payload.stage;

    this.updateLastEditedOn();
  }

  // MODULE RELATED

  addModule(): void {
    this.modules.push({
      id: nanoid(24),
      lessons: [],
      lastEditedOn: new Date(Date.now()),
    });

    this.updateLastEditedOn();
  }

  // Direct update won't work like "this.modules[index].title = title"
  updateModule(id: string, payload: ModuleMetadata): void {
    var index = this.modules.findIndex(function findModule(m) {
      return m.id == id;
    });
    var module = this.modules[index];
    if (!module) throw new BaseApiError(400, "Module not found");

    for (let key in payload) {
      if (payload[key]) module[key] = payload[key];
    }

    module.lastEditedOn = new Date(Date.now());
    this.modules[index] = module;
  }

  deleteModule(id: string): Types.ObjectId[] {
    var deleteAt = this.modules.findIndex(function findModule(m) {
      return m.id == id;
    });
    if (deleteAt == -1) throw new BaseApiError(400, "Module not found");

    var lessons = this.modules[deleteAt].lessons; // Get all lessons in the module
    this.modules.splice(deleteAt, 1); // Remove module

    return lessons as Types.ObjectId[];
  }

  updateModules(payload: TCourseModuleClass[]): void {
    this.modules = payload;
    this.updateLastEditedOn();
  }

  // LESSON RELATED

  getAllLessons(): Types.ObjectId[] {
    var lessons: Types.ObjectId[] = [];
    for (let module of this.modules) {
      lessons = lessons.concat(module.lessons as Types.ObjectId[]);
    }
    return lessons;
  }

  deleteLesson(lessonId: string) {
    for (let module of this.modules) {
      var deleteAt = module.lessons.findIndex(function findLesson(l) {
        return l == new mongoose.Types.ObjectId(lessonId);
      });
      if (deleteAt != -1) {
        module.lessons.splice(deleteAt, 1);
        break;
      }
    }
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
