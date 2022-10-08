import { string } from "zod";

// ==============================
// User
// ==============================

var zodUserFullName = string({ required_error: "Full name is required" })
  .max(240, "Full name is too long")
  .min(6, "Full name is too short");

var zodUserUsername = string({ required_error: "Username is required" })
  .max(120, "Username is too long")
  .min(3, "Username is too short");

var zodUserEmail = string({ required_error: "Email is required" }).email(
  "Invalid email"
);

var zodUserPassword = string({
  required_error: "Password is required",
}).min(6, "Password is too short");

var zodUserConfirmPassword = string({
  required_error: "Confirm password is required",
});

export var zodUser = {
  fullName: zodUserFullName,
  username: zodUserUsername,
  email: zodUserEmail,
  password: zodUserPassword,
  confirmPassword: zodUserConfirmPassword,
};
