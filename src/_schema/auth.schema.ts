import { z } from "zod";

import { passwordRegex } from "../_utils/auth.util";

// ==========================
// Schemas
// ==========================

// Signup

export var signupSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Required" })
      .min(3, "Too short")
      .max(32, "Too long"),
    email: z.string({ required_error: "Required" }).email("Invalid"),
    password: z
      .string({ required_error: "Required" })
      .min(8, "Too short")
      .max(64, "Too long")
      .refine(
        function checkPasswordStrength(pwd) {
          return passwordRegex.test(pwd);
        },
        { message: "Weak", path: ["password"] }
      ),
  }),
});

export var completeOAuthSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Required" })
      .min(3, "Too short")
      .max(32, "Too long"),
    email: z.string({ required_error: "Required" }).email("Invalid"),
  }),
});

// LOGIN

export var loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Required" }).email("Invalid"),
    password: z
      .string({ required_error: "Required" })
      .min(6, "Too short")
      .max(120, "Too long"),
  }),
});

// EMAIL VERIFICATION

export var verifyEmailSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Required" }).email("Invalid"),
  }),
});

// TODO: add length validation to the token
export var confirmEmailSchema = z.object({
  params: z.object({ token: z.string() }),
});

// PASSWORD RESET

export var forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Required" }).email("Invalid"),
  }),
});

export var passwordResetSchema = z.object({
  params: z.object({ token: z.string() }),
  body: z
    .object({
      password: z
        .string({ required_error: "Required" })
        .min(6, "Too short")
        .max(120, "Too long"),
      confirmPassword: z
        .string({ required_error: "Required" })
        .min(6, "Too short")
        .max(120, "Too long"),
    })
    .refine(
      function validatePassword(data) {
        return data.password == data.confirmPassword;
      },
      { message: "Passwords do not match", path: ["confirmPassword"] }
    ),
});

// =========================
// TYPES
// =========================

export type Signup = z.infer<typeof signupSchema>;
export type CompleteOAuth = z.infer<typeof completeOAuthSchema>;

export type Login = z.infer<typeof loginSchema>;

export type VerifyEmail = z.infer<typeof verifyEmailSchema>;
export type ConfirmEmail = z.infer<typeof confirmEmailSchema>;

export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
