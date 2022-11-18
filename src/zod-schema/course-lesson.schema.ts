import { Types } from "mongoose";
import { boolean, number, object, string, TypeOf } from "zod";

import { EditorContentType } from "../models/editor-content.model";

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

var lessonId = string({ required_error: "Required" }).refine(
  function validateId(id) {
    return Types.ObjectId.isValid(id);
  },
  { message: "Invalid", path: ["lessonId"] }
);

// =========================
// SCHEMAS
// =========================

// LESSON

export var createLessonSchema = object({
  params: object({ courseId, moduleId }),
});

export var updateLessonMetadataSchema = object({
  params: object({ courseId, moduleId, lessonId }),
  body: object({
    title: string({ required_error: "Required" }),
    description: string({ required_error: "Required" }),
    emoji: string({ required_error: "Required" }),
    isFree: boolean({ required_error: "Required" }),
  }),
});

export var deleteLessonSchema = object({
  params: object({ courseId, moduleId, lessonId }),
});

// CONTENT

export var addContentSchema = object({
  params: object({ courseId, moduleId, lessonId }),
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

export var updateContentSchema = object({
  params: object({ courseId, moduleId, lessonId }),
  body: object({
    updateAt: number({ required_error: "Add at is required" }).min(
      0,
      "Add at must be greater than or equal to 0"
    ),
  }),
});

export var deleteContentSchema = object({
  params: object({ courseId, moduleId, lessonId }),
});

// =========================
// TYPES
// =========================

export type CreateLesson = TypeOf<typeof createLessonSchema>;
export type UpdateLessonMetadata = TypeOf<typeof updateLessonMetadataSchema>;
export type DeleteLesson = TypeOf<typeof deleteLessonSchema>;

export type AddContent = TypeOf<typeof addContentSchema>;
export type UpdateContent = TypeOf<typeof updateContentSchema>;
export type DeleteContent = TypeOf<typeof deleteContentSchema>;
