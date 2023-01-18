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

export var updateDetailsSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: "Required" })
      .min(6, "Too short")
      .max(48, "Too long"),
    username: z
      .string({ required_error: "Required" })
      .min(3, "Too short")
      .max(32, "Too long"),
    email: z.string({ required_error: "Required" }).email("Invalid"),
  }),
});

// =========================
// TYPES
// =========================

export type UserExists = z.infer<typeof userExistsSchema>;

export type UpdateDetails = z.infer<typeof updateDetailsSchema>;
