import { Types } from "mongoose";
import { array, number, object, string, TypeOf } from "zod";

import { CourseCourseDifficulty } from "../models/course.model";

// =========================
// UTILS
// =========================

// PARAMS

var courseId = string({ required_error: "Required" }).refine(
  function validateId(id) {
    return Types.ObjectId.isValid(id);
  },
  { message: "Invalid", path: ["courseId"] }
);

var moduleId = string({ required_error: "Required" });

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

var lessons = string()
  .array()
  .refine(
    function validateLessons(lessons) {
      var results = lessons.map((lesson) => {
        var regex = new RegExp(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i);
        return regex.test(lesson);
      });
      return results.every((result) => result == true);
    },
    { message: "Invalid", path: ["lessons"] }
  );

// =========================
// SCHEMAS
// =========================

// COURSE

export var getCourseSchema = object({ params: object({ courseId }) });

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

export var deleteCourseSchema = object({ params: object({ courseId }) });

// MODULE

export var addModuleSchema = object({ params: object({ courseId }) });

export var updateModuleSchema = object({
  params: object({ courseId, moduleId }),
  body: object({
    emoji,
    title,
    description,
    lessons,
  }),
});

export var getModuleSchema = object({ params: object({ courseId, moduleId }) });

export var deleteModuleSchema = object({
  params: object({ courseId, moduleId }),
});

export var reorderModulesSchema = object({
  params: object({ courseId }),
  body: object({ modules: object({}).array() }),
});

export var reorderLessonsSchema = object({
  params: object({ courseId, moduleId }),
  body: object({
    lessons: string()
      .array()
      .refine(function validateLessons(lessons) {
        var results = lessons.map(function validateId(id) {
          return Types.ObjectId.isValid(id);
        });
        return results.every((result) => result == true);
      }),
  }),
});

// =========================
// TYPES
// =========================

export type GetCourse = TypeOf<typeof getCourseSchema>;
export type UpdateCourseMetadata = TypeOf<typeof updateCourseMetadataSchema>;
export type DeleteCourse = TypeOf<typeof deleteCourseSchema>;
export type ReorderModules = TypeOf<typeof reorderModulesSchema>;

export type AddModule = TypeOf<typeof addModuleSchema>;
export type UpdateModule = TypeOf<typeof updateModuleSchema>;
export type GetModule = TypeOf<typeof getModuleSchema>;
export type DeleteModule = TypeOf<typeof deleteModuleSchema>;
export type ReorderLessons = TypeOf<typeof reorderLessonsSchema>;
