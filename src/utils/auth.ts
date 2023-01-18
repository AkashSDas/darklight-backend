import { CookieOptions } from "express";

import { getEnv } from "./config";

export function getLoginCookieConfig(): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: getEnv().refreshTokenExpiresInMs,
  };
}

/**
 * (?=(.*RULE){MIN_OCCURANCES,})
 *
 * ^                               start anchor
 * (?=(.*[a-z]){3,})               lowercase letters. {3,} indicates that you want 3 of this group
 * (?=(.*[A-Z]){2,})               uppercase letters. {2,} indicates that you want 2 of this group
 * (?=(.*[0-9]){2,})               numbers. {2,} indicates that you want 2 of this group
 * (?=(.*[!@#$%^&*()\-__+.]){1,})  all the special characters in the [] fields. The ones used by regex are escaped by using the \ or the character itself. {1,} is redundant, but good practice, in case you change that to more than 1 in the future. Also keeps all the groups consistent
 * {8,}                            indicates that you want 8 or more
 * $                               end anchor
 */
export var passwordRegex = new RegExp(
  /^(?=(.*[a-z]){3,})(?=(.*[A-Z]){2,})(?=(.*[0-9]){2,})(?=(.*[!@#$%^&*()\-__+.]){1,}).{8,}$/
);
