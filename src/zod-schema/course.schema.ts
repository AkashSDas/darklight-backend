import { boolean, number, object, string, TypeOf } from "zod";

import { CourseCourseDifficulty } from "../models/course.model";

// =========================
// UTILS
// =========================

// PARAMS

var courseId = string({ required_error: "Required" }).regex(
  /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i,
  "Invalid course id"
);

// BODY

var emoji = string().regex(
  /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u,
  "Invalid emoji"
);
var title = string().max(100, "Too long");
var description = string().max(500, "Too long");
var stage = string().refine(
  function validateCourseStage(stage) {
    return stage in CourseCourseDifficulty;
  },
  { message: "Invalid", path: ["stage"] }
);
var price = number().positive("Invalid").max(100000, "Too high");
var difficulty = string().refine(
  function validateDifficultyLevel(level) {
    return level in CourseCourseDifficulty;
  },
  { message: "Invalid", path: ["difficulty"] }
);
var tags = string().array().max(10, "Too many tags");

// =========================
// SCHEMAS
// =========================

export var updateCourseMetadataSchema = object({
  params: object({ courseId }),
  body: object({
    emoji,
    title,
    description,
    stage,
    price,
    difficulty,
    tags,
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

// =========================
// TYPES
// =========================

export type UpdateCourseMetadata = TypeOf<typeof updateCourseMetadataSchema>;

export type ZodGetCourse = TypeOf<typeof getCourseSchema>;
export type ZodAddModuleToCourse = TypeOf<typeof addModuleToCourseSchema>;
export type ZodUpdateCourseModule = TypeOf<typeof updateCourseModuleSchema>;
export type ZodDeleteCourseModule = TypeOf<typeof deleteCourseModuleSchema>;
export type ZodReorderLessonsInModule = TypeOf<
  typeof reorderLessonsInModuleSchema
>;
