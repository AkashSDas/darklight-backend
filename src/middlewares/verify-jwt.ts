import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { getUserService } from "../services/user.service";
import { BaseApiError } from "../utils/handle-error";

async function verifyJwt(req: Request, res: Response, next: NextFunction) {
  // Check if the bearer token is present in the request header
  var authHeader =
    req.headers.authorization || (req.headers.Authorization as string);
  if (!authHeader?.startsWith("Bearer ")) {
    throw new BaseApiError(401, "Unauthorized");
  }

  // Verify the token
  var token = authHeader.split(" ")[1];

  try {
    let decodedJwt = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    ) as JwtPayload;

    let user = await getUserService({ _id: decodedJwt._id });
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new BaseApiError(401, "Token expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new BaseApiError(401, "Unauthorized");
    }

    throw new BaseApiError(500, "Something went wrong, please try again");
  }
}

export default verifyJwt;
