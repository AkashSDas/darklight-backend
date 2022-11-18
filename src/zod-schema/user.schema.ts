import { z } from "zod";

// =========================
// SCHEMAS
// =========================

// OTHERS

export var userExistsSchema = z.object({
  query: z.object({
    email: z.string().email("Invalid").optional(),
    username: z.string().min(3, "Too short").max(120, "Too long").optional(),
  }),
});

// =========================
// TYPES
// =========================

export type UserExistsSchema = z.infer<typeof userExistsSchema>;
