import { Router } from "express";

import { buyCourseController } from "../controller/course-profile.controller";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";

export var router = Router();

router.post(
  "/buy",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(buyCourseController),
  sendErrorResponse
);
