import { Router } from "express";

import { addContentToCourseLesson, addLessonToCourseController, addModuleToCourseController, createCourseController, deleteContentInCourseLesson, reorderCourseLessonContentsController, updateContentInCourseLesson, updateCourseModuleController } from "../controller/course.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import { addContentToCourseLessonSchema, addLessonToCourseSchema, addModuleToCourseSchema, deleteContentInCourseLessonSchema, updateContentInCourseLessonSchema } from "../zod-schema/course.schema";

export var router = Router();

// Course
router.post(
  "/",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(createCourseController),
  sendErrorResponse
);

// Module
router
  .post(
    "/:courseId",
    validateResource(addModuleToCourseSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(addModuleToCourseController),
    sendErrorResponse
  )
  .put(
    "/:courseId/:moduleId",
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(updateCourseModuleController),
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
  )
  .post(
    "/:courseId/:lessonId/reorder",
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(reorderCourseLessonContentsController),
    sendErrorResponse
  );
