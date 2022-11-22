import { CookieOptions } from "express";

export var loginCookieConfig: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
};
