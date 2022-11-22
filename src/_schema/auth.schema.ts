import { z } from "zod";

// =========================
// SCHEMAS
// =========================

// SIGNUP

export var signupSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Required" })
      .min(3, "Too short")
      .max(120, "Too long"),
    email: z.string({ required_error: "Required" }).email("Invalid"),
    password: z
      .string({ required_error: "Required" })
      .min(6, "Too short")
      .max(120, "Too long"),
  }),
});

// =========================
// TYPES
// =========================

export type SignupSchema = z.infer<typeof signupSchema>;
