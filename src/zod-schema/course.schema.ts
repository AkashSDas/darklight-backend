import { number, object, string, TypeOf } from "zod";

import { CourseCourseDifficulty } from "../models/course.model";

// ============================================
// Schemas
// ============================================

export var updateCourseSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
  }),
  body: object({
    title: string(),
    description: string(),
    stage: string().refine(
      function zodValidateCourseStage(value) {
        return value == "draft" || value == "published";
      },
      { message: "Invalid course stage", path: ["stage"] }
    ),
    price: number().min(0),
    difficulty: string().refine(
      function zodValidateCourseDifficulty(value) {
        return Object.values(CourseCourseDifficulty).includes(value as any);
      },
      { message: "Invalid course difficulty", path: ["difficulty"] }
    ),
    tags: string().array(),
  }),
});

export var getCourseSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
  }),
});

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

export var reorderLessonsInModuleSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    moduleId: string({ required_error: "Module id is required" }),
  }),
  body: object({
    lessons: string().array(),
  }),
});

// ============================================
// Types
// ============================================

export type ZodUpdateCourse = TypeOf<typeof updateCourseSchema>;
export type ZodGetCourse = TypeOf<typeof getCourseSchema>;
export type ZodAddModuleToCourse = TypeOf<typeof addModuleToCourseSchema>;
export type ZodUpdateCourseModule = TypeOf<typeof updateCourseModuleSchema>;
export type ZodDeleteCourseModule = TypeOf<typeof deleteCourseModuleSchema>;
export type ZodReorderLessonsInModule = TypeOf<
  typeof reorderLessonsInModuleSchema
>;
