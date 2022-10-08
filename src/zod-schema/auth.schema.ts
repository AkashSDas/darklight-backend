import { object, TypeOf } from "zod";

import { zodUser } from "./";

// ============================================
// Schemas
// ============================================

export var signupSchema = object({
  body: object({
    fullName: zodUser.fullName,
    username: zodUser.username,
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

// ============================================
// Types
// ============================================

export type ZodSignup = TypeOf<typeof signupSchema>;
