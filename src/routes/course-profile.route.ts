import { Router } from "express";

import { buyCourseController, courseProfileController, getCourseProfilesController, updateCourseProfileController, updateCourseProgressController } from "../controller/course-profile.controller";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";

export var router = Router();

// ==================================
// COURSE PAYMENT ROUTES
// ==================================

// Buy course
router.post(
  "/buy",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(buyCourseController),
  sendErrorResponse
);

// ==================================
// COURSE DATA ROUTES
// ==================================

// Get purchased course
router.get(
  "/:userId/:courseId",
  handleMiddlewarelError(courseProfileController),
  sendErrorResponse
);

// Get all purchased courses
router.get(
  "/:userId",
  handleMiddlewarelError(getCourseProfilesController),
  sendErrorResponse
);

// Update course profile
router.put(
  "/:userId/:courseId",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(updateCourseProfileController),
  sendErrorResponse
);

// Update course progress
router.get(
  "/:userId/:courseId/:lessonId/done",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(updateCourseProgressController),
  sendErrorResponse
);
