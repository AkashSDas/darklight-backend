import { object, string, TypeOf } from "zod";

// ============================================
// Schemas
// ============================================

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

export type ZodGetCourse = TypeOf<typeof getCourseSchema>;
export type ZodAddModuleToCourse = TypeOf<typeof addModuleToCourseSchema>;
export type ZodUpdateCourseModule = TypeOf<typeof updateCourseModuleSchema>;
export type ZodDeleteCourseModule = TypeOf<typeof deleteCourseModuleSchema>;
export type ZodReorderLessonsInModule = TypeOf<
  typeof reorderLessonsInModuleSchema
>;
