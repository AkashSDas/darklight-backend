import { getModelForClass, Severity } from "@typegoose/typegoose";

import { CourseClass } from "./course.model";
import { LessonClass } from "./lesson.model";

// To resolve Circular Dependency issue that was created while using `Ref` in `lesson.model.ts`
// for course
// https://typegoose.github.io/typegoose/docs/guides/advanced/reference-other-classes#common-problems

export var Course = getModelForClass(CourseClass, {
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "-course" },
});

export var Lesson = getModelForClass(LessonClass, {
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "-lesson" },
});
