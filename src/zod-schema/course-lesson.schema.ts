import { object, string, TypeOf } from "zod";

// ============================================
// Schemas
// ============================================

export var createCourseLessonSchema = object({
  params: object({
    courseId: string({ required_error: "Course id is required" }),
    moduleId: string({ required_error: "Module id is required" }),
  }),
});

// ============================================
// Types
// ============================================

export type ZodCreateCourseLesson = TypeOf<typeof createCourseLessonSchema>;
