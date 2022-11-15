import { Router } from "express";

import {
  buyCourseController,
  getCourseProfileController,
  getCourseProfilesController,
  updateCourseProfileController,
  updateCourseProgressController,
} from "../controller/course-profile.controller";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";

export var router = Router();

router
  .post(
    "/buy",
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(buyCourseController),
    sendErrorResponse
  )
  .get(
    "/:userId/:courseId",
    handleMiddlewarelError(getCourseProfileController),
    sendErrorResponse
  )
  .get(
    "/:userId",
    handleMiddlewarelError(getCourseProfilesController),
    sendErrorResponse
  )
  .put(
    "/:userId/:courseId",
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(updateCourseProfileController),
    sendErrorResponse
  )
  .get(
    "/:userId/:courseId/:lessonId/done",
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(updateCourseProgressController),
    sendErrorResponse
  );
