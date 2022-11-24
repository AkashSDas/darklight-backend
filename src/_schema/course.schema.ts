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

export var settingsSchema = z.object({
  params: z.object({ courseId: mongoIdSchema("courseId") }),
  body: z.object({
    emoji: z.string().optional(),
    title: z.string().max(120, "Too long").optional(),
    description: z.string().max(120, "Too long").optional(),
    stage: z.nativeEnum(CourseStage).optional(),
    price: z.number().min(0, "Too low").optional(),
    difficulty: z.nativeEnum(CourseDifficulty).optional(),
    tags: z.array(z.string()).optional(),
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

// =========================
// TYPES
// =========================

export type Settings = z.infer<typeof settingsSchema>;
