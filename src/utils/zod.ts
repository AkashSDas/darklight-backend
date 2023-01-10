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

// =====================================
// Types
// =====================================

export type Signup = z.infer<typeof signup>;
export type Login = z.infer<typeof login>;
