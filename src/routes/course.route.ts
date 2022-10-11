import { Router } from "express";

import { addContentToCourseLesson, addLessonToCourseController, createCourseController, deleteContentInCourseLesson, updateContentInCourseLesson } from "../controller/course.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import { addContentToCourseLessonSchema, addLessonToCourseSchema, deleteContentInCourseLessonSchema, updateContentInCourseLessonSchema } from "../zod-schema/course.schema";

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

// Content
router
  .post(
    "/:courseId/:lessonId",
    validateResource(addContentToCourseLessonSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(addContentToCourseLesson),
    sendErrorResponse
  )
  .put(
    "/:courseId/:lessonId",
    validateResource(updateContentInCourseLessonSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(updateContentInCourseLesson),
    sendErrorResponse
  )
  .delete(
    "/:courseId/:lessonId",
    validateResource(deleteContentInCourseLessonSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(deleteContentInCourseLesson),
    sendErrorResponse
  );
