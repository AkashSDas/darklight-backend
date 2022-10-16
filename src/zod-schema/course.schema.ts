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

export var updateCourseModuleSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    moduleId: string({ required_error: "Module id is required" }),
  }),
  body: object({
    emoji: string().min(0).max(1),
    title: string().min(0).max(120),
    description: string().min(0).max(120),
    lessons: string().array(),
  }),
});

export var deleteCourseModuleSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    moduleId: string({ required_error: "Module id is required" }),
  }),
});

// ============================================

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
export type ZodUpdateCourseModule = TypeOf<typeof updateCourseModuleSchema>;
export type ZodDeleteCourseModule = TypeOf<typeof deleteCourseModuleSchema>;

export type ZodAddContentToCourseLesson = TypeOf<
  typeof addContentToCourseLessonSchema
>;
export type ZodUpdateContentInCourseLesson = TypeOf<
  typeof updateContentInCourseLessonSchema
>;
export type ZodDeleteContentInCourseLesson = TypeOf<
  typeof deleteContentInCourseLessonSchema
>;
