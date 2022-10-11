import { Router } from "express";

import { addLessonToCourseController, createCourseController } from "../controller/course.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import { addLessonToCourseSchema } from "../zod-schema/course.schema";

export var router = Router();

// Course

router.post(
  "/",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(createCourseController),
  sendErrorResponse
);

// Lesson

router.post(
  "/:courseId",
  validateResource(addLessonToCourseSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(addLessonToCourseController),
  sendErrorResponse
);
