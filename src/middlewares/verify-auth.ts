import { NextFunction, Request, Response } from "express";

import verifyJwt from "./verify-jwt";

async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  // Check if the user is logged in using OAuth
  if (req.user) return next();

  // If the user is logged in using JWT
  return verifyJwt(req, res, next);
}

export default verifyAuth;
