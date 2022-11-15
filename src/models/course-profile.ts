import { SchemaTypes, Types } from "mongoose";

import { getModelForClass, prop, Ref, Severity } from "@typegoose/typegoose";

import { TCourseLessonClass } from "./course-lesson.model";
import { TCourseClass } from "./course.model";
import { TUserClass } from "./user.model";

class TPurchaseInfoClass {
  @prop({
    required: true,
    immutable: true,
    type: SchemaTypes.Date,
    default: Date.now,
  })
  purchasedAt: Date;
}

class TLessonProgressClass {
  @prop({ ref: () => TCourseLessonClass, required: true })
  lesson: Ref<TCourseLessonClass>;

  @prop({ type: SchemaTypes.Boolean, default: false })
  done: boolean;
}

export class TCourseProfileClass {
  @prop({ ref: () => TCourseClass, required: true })
  user: Ref<TUserClass>;

  @prop({ ref: () => TCourseClass, required: true })
  course: Ref<TCourseClass>;

  @prop({ type: () => TPurchaseInfoClass, required: true })
  purchasedInfo: TPurchaseInfoClass;

  // When a student completes a lesson, the lesson id with done as true
  // will be added to this
  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  progress: TLessonProgressClass[];

  // ===============================
  // Methods
  // ===============================

  // ===============================
  // Virtuals
  // ===============================

  _id!: Types.ObjectId;
  /** Get transformed MongoDB `_id` */
  get id() {
    return this._id.toHexString();
  }
}

export var CourseProfile = getModelForClass(TCourseProfileClass, {
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "course-profile" },
});
