import { Router } from "express";

import { createCourseController } from "../controller/course.controller";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";

export var router = Router();

router.post(
  "/",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(createCourseController),
  sendErrorResponse
);
