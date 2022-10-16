import { Router } from "express";

import { addContentInLessonController, createCourseLessonController } from "../controller/course-lesson.controller";
import { addModuleToCourseController, createCourseController, deleteContentInCourseLesson, deleteCourseModuleController, reorderCourseLessonContentsController, updateContentInCourseLesson, updateCourseModuleController } from "../controller/course.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import { addContentInLessonSchema, createCourseLessonSchema } from "../zod-schema/course-lesson.schema";
import { addModuleToCourseSchema, deleteContentInCourseLessonSchema, deleteCourseModuleSchema, updateContentInCourseLessonSchema } from "../zod-schema/course.schema";

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
  )
  .delete(
    "/:courseId/:moduleId",
    validateResource(deleteCourseModuleSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(deleteCourseModuleController),
    sendErrorResponse
  );

// Lesson
router.post(
  "/:courseId/:moduleId",
  validateResource(createCourseLessonSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(createCourseLessonController)
);

// Content
router.post(
  "/:courseId/:moduleId/:lessonId",
  validateResource(addContentInLessonSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(addContentInLessonController),
  sendErrorResponse
);

router
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
