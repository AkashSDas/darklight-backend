import { number, object, string, TypeOf } from "zod";

import { EditorContentType } from "../models/editor-content.model";

// ============================================
// Schemas
// ============================================

export var addModuleToCourseSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
  }),
});

export var addContentToCourseLessonSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    lessonId: string({ required_error: "Lesson id is required" }),
  }),
  body: object({
    type: string({ required_error: "Type is required" }).refine(
      function checkContentType(value) {
        return Object.values(EditorContentType).includes(value as any);
      }
    ),
    addAt: number({ required_error: "Add at is required" }).min(
      0,
      "Add at must be greater than or equal to 0"
    ),
  }),
});

export var updateContentInCourseLessonSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    lessonId: string({ required_error: "Lesson id is required" }),
  }),
  body: object({
    updateAt: number({ required_error: "Add at is required" }).min(
      0,
      "Add at must be greater than or equal to 0"
    ),
  }),
});

export var deleteContentInCourseLessonSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    lessonId: string({ required_error: "Lesson id is required" }),
  }),
  body: object({
    deleteAt: number({ required_error: "Add at is required" }).min(
      0,
      "Add at must be greater than or equal to 0"
    ),
  }),
});

// TODO: add body schema and use it reorderCourseLessonContentsController
export var reorderCourseLessonContentsSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    lessonId: string({ required_error: "Lesson id is required" }),
  }),
  body: object({}),
});

// ============================================
// Types
// ============================================

export type ZodAddModuleToCourse = TypeOf<typeof addModuleToCourseSchema>;
export type ZodAddContentToCourseLesson = TypeOf<
  typeof addContentToCourseLessonSchema
>;
export type ZodUpdateContentInCourseLesson = TypeOf<
  typeof updateContentInCourseLessonSchema
>;
export type ZodDeleteContentInCourseLesson = TypeOf<
  typeof deleteContentInCourseLessonSchema
>;
