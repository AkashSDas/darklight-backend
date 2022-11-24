import { z } from "zod";

// =========================
// SCHEMAS
// =========================

export var userExistsSchema = z.object({
  query: z.object({
    email: z.string().email("Invalid").optional(),
    username: z.string().min(3, "Too short").max(24, "Too long").optional(),
  }),
});

// =========================
// TYPES
// =========================

export type UserExists = z.infer<typeof userExistsSchema>;
