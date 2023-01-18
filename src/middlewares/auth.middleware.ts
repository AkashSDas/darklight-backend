import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import User from "../models/user.schema";
import { getEnv } from "../utils/config";
import { BaseApiError } from "../utils/error";

async function verifyJwt(req: Request, _res: Response, next: NextFunction) {
  // Check if the bearer token is present in the request header
  var authHeader = req.headers.Authorization as string;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new BaseApiError(401, "Unauthorized");
  }

  // Verify the token
  var token = authHeader.split(" ")[1];

  try {
    let decodedJwt = jwt.verify(
      token,
      getEnv().accessTokenSecret
    ) as jwt.JwtPayload;

    let user = await User.findById(decodedJwt._id);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new BaseApiError(401, "Token expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new BaseApiError(401, "Unauthorized");
    }

    throw new BaseApiError(500, "Internal server error");
  }
}

async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  // Check if the user is logged in using OAuth
  if (req.user) return next();

  // If the user is logged in using JWT
  return verifyJwt(req, res, next);
}

export default verifyAuth;
