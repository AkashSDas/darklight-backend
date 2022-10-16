import { number, object, string, TypeOf } from "zod";

import { EditorContentType } from "../models/editor-content.model";

// ============================================
// Schemas
// ============================================

export var createCourseLessonSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    moduleId: string({ required_error: "Module id is required" }),
  }),
});

export var addContentInLessonSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    moduleId: string({ required_error: "Module id is required" }),
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

export var updateContentInLessonSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    moduleId: string({ required_error: "Module id is required" }),
    lessonId: string({ required_error: "Lesson id is required" }),
  }),
  body: object({
    updateAt: number({ required_error: "Add at is required" }).min(
      0,
      "Add at must be greater than or equal to 0"
    ),
  }),
});

export var deleteContentInLessonSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    moduleId: string({ required_error: "Module id is required" }),
    lessonId: string({ required_error: "Lesson id is required" }),
  }),
});

// ============================================
// Types
// ============================================

export type ZodCreateCourseLesson = TypeOf<typeof createCourseLessonSchema>;
export type ZodAddContentInLesson = TypeOf<typeof addContentInLessonSchema>;
export type ZodUpdateContentInLesson = TypeOf<
  typeof updateContentInLessonSchema
>;
export type ZodDeleteContentInLesson = TypeOf<
  typeof deleteContentInLessonSchema
>;
