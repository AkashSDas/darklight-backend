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

export var completeOAuthSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Required" })
      .min(3, "Too short")
      .max(120, "Too long"),
    email: z.string({ required_error: "Required" }).email("Invalid"),
  }),
});

// =========================
// TYPES
// =========================

export type Signup = z.infer<typeof signupSchema>;
export type CompleteOAuth = z.infer<typeof completeOAuthSchema>;
