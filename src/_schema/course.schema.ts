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
    stage: z
      .nativeEnum(CourseStage, {
        errorMap: (issue, _ctx) => {
          switch (issue.code) {
            case "invalid_type":
              return { message: "Invalid" };
            case "invalid_enum_value":
              return { message: "Invalid" };
            default:
              return { message: "Invalid" };
          }
        },
      })
      .optional(),
    price: z.number().min(0, "Too low").optional(),
    difficulty: z
      .nativeEnum(CourseDifficulty, {
        errorMap: (issue, _ctx) => {
          switch (issue.code) {
            case "invalid_type":
              return { message: "Invalid" };
            case "invalid_enum_value":
              return { message: "Invalid" };
            default:
              return { message: "Invalid" };
          }
        },
      })
      .optional(),
    tags: z
      .array(z.string().max(32, "Too long"), { invalid_type_error: "Invalid" })
      .optional(),
    faqs: z
      .array(
        z.object({
          question: z
            .string({ required_error: "Required" })
            .max(120, "Too long"),
          answer: z.string({ required_error: "Required" }).max(120, "Too long"),
        }),
        { invalid_type_error: "Invalid" }
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

export var addGroupSchema = z.object({
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

export var moveLessonToAnotherGroupSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
  }),
  body: z.object({ newGroupId: mongoIdSchema("newGroupId") }),
});

export var deleteLessonSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
  }),
})

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

export var reorderContentSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
  }),
  body: z.object({
    order: z.array(z.string({ required_error: "Required" })),
  }),
});

// Attachment

export var addAttachmentSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
  }),
  body: z.object({
    description: z.string().max(120, "Too long").optional(),
  })
})

export var removeAttachmentSchema = z.object({
  params: z.object({
    courseId: mongoIdSchema("courseId"),
    groupId: mongoIdSchema("groupId"),
    lessonId: mongoIdSchema("lessonId"),
  }),
  body: z.object({
    attachmentId: z.string({ required_error: "Required" }),
  })
})

// =========================
// TYPES
// =========================

export type CourseSettings = z.infer<typeof courseSettingsSchema>;
export type UpdateCourseCover = z.infer<typeof updateCourseCoverSchema>;
export type GetCourse = z.infer<typeof getCourseSchema>;

export type AddGroup = z.infer<typeof addGroupSchema>;
export type UpdateGroup = z.infer<typeof updateGroupSchema>;
export type ReorderLessons = z.infer<typeof reorderLessonsSchema>;

export type CreateLesson = z.infer<typeof createLessonSchema>;
export type UpdateLessonSettings = z.infer<typeof updateLessonSettingsSchema>;
export type UpdateLessonVideo = z.infer<typeof updateLessonVideoSchema>;
export type MoveLessonToAnotherGroup = z.infer<
  typeof moveLessonToAnotherGroupSchema
>;
export type DeleteLesson = z.infer<typeof deleteLessonSchema>;

export type CreateContent = z.infer<typeof createContentSchema>;
export type UpdateContent = z.infer<typeof updateContentSchema>;
export type ReorderContent = z.infer<typeof reorderContentSchema>;

export type AddAttachment = z.infer<typeof addAttachmentSchema>;
export type RemoveAttachment = z.infer<typeof removeAttachmentSchema>;