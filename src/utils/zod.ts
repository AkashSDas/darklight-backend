import { z } from "zod";

import { passwordRegex } from "./auth";

// =====================================
// Schemas
// =====================================

export var signup = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Required" })
      .min(4, "Too short")
      .max(24, "Too long"),
    email: z.string({ required_error: "Required" }).email("Invalid"),
    password: z
      .string({ required_error: "Required" })
      .min(8, "Too short")
      .max(64, "Too long")
      .refine(
        function checkPasswordStrength(pwd) {
          return passwordRegex.test(pwd);
        },
        { message: "Password is weak", path: ["password"] }
      ),
  }),
});

export var completeOauthSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Required" })
      .min(4, "Too short")
      .max(24, "Too long"),
    email: z.string({ required_error: "Required" }).email("Invalid"),
  }),
});

export var login = z.object({
  body: z.object({
    email: z.string({ required_error: "Required" }).email("Invalid"),
    password: z
      .string({ required_error: "Required" })
      .min(8, "Too short")
      .max(64, "Too long")
      .refine(
        function checkPasswordStrength(pwd) {
          return passwordRegex.test(pwd);
        },
        { message: "Password is invalid", path: ["password"] }
      ),
  }),
});

export var verifyEmail = z.object({
  body: z.object({
    email: z.string({ required_error: "Required" }).email("Invalid"),
  }),
});

export var confirmEmail = z.object({
  params: z.object({ token: z.string() }),
});

export var forgotPassword = z.object({
  body: z.object({
    email: z.string({ required_error: "Required" }).email("Invalid"),
  }),
});

export var passwordReset = z.object({
  params: z.object({ token: z.string() }),
  body: z
    .object({
      password: z
        .string({ required_error: "Required" })
        .min(8, "Too short")
        .max(64, "Too long"),
      confirmPassword: z
        .string({ required_error: "Required" })
        .min(8, "Too short")
        .max(64, "Too long"),
    })
    .refine(
      function validatePassword(data) {
        return data.password == data.confirmPassword;
      },
      { message: "Passwords do not match", path: ["confirmPassword"] }
    ),
});

// =====================================
// Types
// =====================================

export type Signup = z.infer<typeof signup>;
export type CompleteOauth = z.infer<typeof completeOauthSchema>;
export type Login = z.infer<typeof login>;
export type VerifyEmail = z.infer<typeof verifyEmail>;
export type ConfirmEmail = z.infer<typeof confirmEmail>;
export type ForgotPassword = z.infer<typeof forgotPassword>;
export type PasswordReset = z.infer<typeof passwordReset>;
