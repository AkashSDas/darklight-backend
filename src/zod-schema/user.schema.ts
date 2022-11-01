import { z } from "zod";

// =========================
// Schema
// =========================

export var userExistsSchema = z.object({
  query: z.object({
    email: z.string().email("Invalid").optional(),
    username: z.string().min(3, "Too short").max(120, "Too long").optional(),
  }),
});

// =========================
// Types
// =========================

export type UserExistsSchema = z.infer<typeof userExistsSchema>;
