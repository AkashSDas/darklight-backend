import { object, string, TypeOf, z } from "zod";

import { zodUser } from "./";

// ============================================
// Schemas
// ============================================

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

export var getEmailVerificationLinkSchema = object({
  body: object({ email: zodUser.email }),
});

export var confirmEmailVerificationSchema = object({
  params: object({ token: string() }),
});

export var loginSchema = object({
  body: object({
    email: zodUser.email,
    password: zodUser.password,
    confirmPassword: zodUser.confirmPassword,
  }).refine(
    function zodValidatePassword(data) {
      return data.password == data.confirmPassword;
    },
    { message: "Passwords do not match", path: ["confirmPassword"] }
  ),
});

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

// ============================================
// Types
// ============================================

export type SignupSchema = z.infer<typeof signupSchema>;
export type CompleteOAuthSchema = z.infer<typeof completeOAuthSchema>;

export type ZodGetEmailVerificationLink = TypeOf<
  typeof getEmailVerificationLinkSchema
>;
export type ZodConfirmEmailVerification = TypeOf<
  typeof confirmEmailVerificationSchema
>;
export type ZodLogin = TypeOf<typeof loginSchema>;
export type ZodForgotPassword = TypeOf<typeof forgotPasswordSchema>;
export type ZodResetPassword = TypeOf<typeof resetPasswordSchema>;
