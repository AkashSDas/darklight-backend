import { object, string, TypeOf, z } from "zod";

import { zodUser } from "./";

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
  body: object({ username: zodUser.username, email: zodUser.email }),
});

// LOGIN

export var loginSchema = z.object({
  body: object({
    email: z.string({ required_error: "Required" }).email("Invalid"),
    password: z
      .string({ required_error: "Required" })
      .min(6, "Too short")
      .max(120, "Too long"),
  }),
});

// EMAIL VERIFICATION

export var verifyEmailSchema = object({
  body: object({ email: zodUser.email }),
});

export var confirmEmailVerificationSchema = object({
  params: object({ token: string() }),
});

// PASSWORD RESET

export var forgotPasswordSchema = object({
  body: object({ email: zodUser.email }),
});

export var resetPasswordSchema = object({
  params: object({ token: string() }),
  body: object({
    password: zodUser.password,
    confirmPassword: zodUser.confirmPassword,
  }).refine(
    function zodValidatePassword(data) {
      return data.password == data.confirmPassword;
    },
    { message: "Passwords do not match", path: ["confirmPassword"] }
  ),
});

// =========================
// TYPES
// =========================

export type SignupSchema = z.infer<typeof signupSchema>;
export type CompleteOAuthSchema = z.infer<typeof completeOAuthSchema>;

export type LoginSchema = z.infer<typeof loginSchema>;

export type VerifyEmail = TypeOf<typeof verifyEmailSchema>;
export type ConfirmEmailVerification = TypeOf<
  typeof confirmEmailVerificationSchema
>;
export type ForgotPassword = TypeOf<typeof forgotPasswordSchema>;
export type ResetPassword = TypeOf<typeof resetPasswordSchema>;
