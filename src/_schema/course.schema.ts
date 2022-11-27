import { Types } from "mongoose";
import { z } from "zod";

import { CourseDifficulty, CourseStage } from "../_utils/course.util";

function mongoIdSchema(path: string) {
  return z.string({ required_error: "Required" }).refine(
    function validateId(id) {
      return Types.ObjectId.isValid(id);
    },
    { message: "Invalid", path: [path] }
  );
}

// =========================
// SCHEMAS
// =========================

// COURSE

export var courseSettingsSchema = z.object({
  params: z.object({ courseId: mongoIdSchema("courseId") }),
  body: z.object({
    emoji: z.string().optional(),
    title: z.string().max(120, "Too long").optional(),
    description: z.string().max(120, "Too long").optional(),
    stage: z.nativeEnum(CourseStage).optional(),
    price: z.number().min(0, "Too low").optional(),
    difficulty: z.nativeEnum(CourseDifficulty).optional(),
    tags: z.array(z.string().max(32, "Too long")).optional(),
    faqs: z
      .array(
        z.object({
          question: z.string().max(120, "Too long"),
          answer: z.string().max(120, "Too long"),
        })
      )
      .optional(),
  }),
});

export var updateCourseCoverSchema = z.object({
  params: z.object({ courseId: mongoIdSchema("courseId") }),
});

export var getCourseSchema = z.object({
  params: z.object({ courseId: mongoIdSchema("courseId") }),
});

// GROUP

export var createGroupSchema = z.object({
  params: z.object({ courseId: mongoIdSchema("courseId") }),
});

export var updateGroupSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
  }),
  body: z.object({
    emoji: z.string().optional(),
    title: z.string().max(120, "Too long").optional(),
    description: z.string().max(120, "Too long").optional(),
  }),
});

export var reorderLessonsSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
  }),
  body: z.object({
    lessons: z.array(mongoIdSchema("lessons")),
  }),
});

// LESSON

export var createLessonSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
  }),
});

export var updateLessonSettingsSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
  }),
  body: z.object({
    emoji: z.string().optional(),
    title: z.string().max(120, "Too long").optional(),
    free: z.boolean().optional(),
  }),
});

export var updateLessonVideoSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
  }),
});

// CONTENT

export var createContentSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
  }),
});

export var updateContentSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
    contentId: z.string({ required_error: "Required" }),
  }),
});

// =========================
// TYPES
// =========================

export type CourseSettings = z.infer<typeof courseSettingsSchema>;
export type UpdateCourseCover = z.infer<typeof updateCourseCoverSchema>;
export type GetCourse = z.infer<typeof getCourseSchema>;

export type CreateGroup = z.infer<typeof createGroupSchema>;
export type UpdateGroup = z.infer<typeof updateGroupSchema>;
export type ReorderLessons = z.infer<typeof reorderLessonsSchema>;

export type CreateLesson = z.infer<typeof createLessonSchema>;
export type UpdateLessonSettings = z.infer<typeof updateLessonSettingsSchema>;
export type UpdateLessonVideo = z.infer<typeof updateLessonVideoSchema>;

export type CreateContent = z.infer<typeof createContentSchema>;
export type UpdateContent = z.infer<typeof updateContentSchema>;
