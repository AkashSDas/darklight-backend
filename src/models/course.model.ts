import mongoose, { SchemaTypes, Types } from "mongoose";
import { nanoid } from "nanoid";

import { getModelForClass, prop, Ref, Severity } from "@typegoose/typegoose";

import { BaseApiError } from "../utils/handle-error";
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

  // ===============================
  // Methods
  // ===============================

  updateLastEditedOn() {
    this.lastEditedOn = new Date(Date.now());
  }

  addModule() {
    this.modules.push({
      id: nanoid(24),
      lessons: [],
      lastEditedOn: new Date(Date.now()),
    });
  }

  updateModule(
    moduleId: string,
    payload: {
      emoji?: string;
      title?: string;
      description?: string;
      lessons?: string[];
    }
  ) {
    var index = this.modules.findIndex(function findModule(m) {
      return m.id == moduleId;
    });
    if (index == -1) throw new BaseApiError(400, "Module not found");
    var module = this.modules[index];

    // Make removed fields as undefined
    for (let key in payload) {
      if (payload[key] == null) {
        if (key == "lessons") payload[key] = [];
        else payload[key] = undefined;
      }
    }

    // Check if all the lessons are valid MongoDB ids OR not
    // TODO: can also check if all of them exists OR not
    if (payload.lessons) {
      // Check if all the lessons are valid MongoDB ids OR not
      for (let lessonId of payload.lessons) {
        if (!Types.ObjectId.isValid(lessonId)) {
          throw new BaseApiError(400, "Invalid lesson id");
        }
      }

      // For reordering, check if newly ordered lessons have same length as old lessons
      if (payload.lessons.length != module.lessons.length) {
        throw new BaseApiError(400, "Invalid lesson ids");
      }
    }

    module = { ...module, ...payload } as any;
    this.modules[index] = module;
    return module;
  }

  // TODO: delete all the lessons of this module
  deleteModule(moduleId: string) {
    var deleteAt = this.modules.findIndex(function findModule(m) {
      return m.id == moduleId;
    });
    if (deleteAt == -1) throw new BaseApiError(400, "Module not found");
    var lessons = this.modules[deleteAt].lessons;
    this.modules.splice(deleteAt, 1);
    return lessons;
  }

  getAllLessons() {
    var lessons = [];
    for (let module of this.modules) {
      lessons = lessons.concat(module.lessons);
    }
    return lessons;
  }

  updateModules(payload: TCourseModuleClass[]) {
    console.log(payload);
    this.modules = payload;
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
