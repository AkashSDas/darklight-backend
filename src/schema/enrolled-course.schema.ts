import { z } from "zod";

// =========================
// SCHEMAS
// =========================

export var buyCourseSchema = z.object({
  query: z.object({
    email: z.string().email("Invalid").optional(),
    username: z.string().min(3, "Too short").max(24, "Too long").optional(),
  }),
});

// =========================
// TYPES
// =========================

export type BuyCourse = z.infer<typeof buyCourseSchema>;
