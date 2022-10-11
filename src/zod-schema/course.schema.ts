import { number, object, string, TypeOf } from "zod";

import { EditorContentType } from "../models/editor-content.model";

// ============================================
// Schemas
// ============================================

export var addLessonToCourseSchema = object({
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

// ============================================
// Types
// ============================================

export type ZodAddLessonToCourse = TypeOf<typeof addLessonToCourseSchema>;
export type ZodAddContentToCourseLesson = TypeOf<
  typeof addContentToCourseLessonSchema
>;
