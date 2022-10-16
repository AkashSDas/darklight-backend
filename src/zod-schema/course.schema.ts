import { object, string, TypeOf } from "zod";

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
