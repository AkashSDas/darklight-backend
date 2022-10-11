import { object, string, TypeOf } from "zod";

// ============================================
// Schemas
// ============================================

export var addLessonToCourseSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
  }),
});

// ============================================
// Types
// ============================================

export type ZodAddLessonToCourse = TypeOf<typeof addLessonToCourseSchema>;
