import { Router } from "express";

import { addContentInLessonController, createCourseLessonController, deleteContentInLessonController, updateContentInLessonController } from "../controller/course-lesson.controller";
import { addModuleToCourseController, createCourseController, deleteCourseModuleController, reorderLessonsInModuleController, updateCourseModuleController } from "../controller/course.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import { addContentInLessonSchema, createCourseLessonSchema, deleteContentInLessonSchema, updateContentInLessonSchema } from "../zod-schema/course-lesson.schema";
import { addModuleToCourseSchema, deleteCourseModuleSchema, reorderLessonsInModuleSchema } from "../zod-schema/course.schema";

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
  )
  .put(
    "/:courseId/:moduleId/reorder",
    validateResource(reorderLessonsInModuleSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(reorderLessonsInModuleController),
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
router
  .post(
    "/:courseId/:moduleId/:lessonId",
    validateResource(addContentInLessonSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(addContentInLessonController),
    sendErrorResponse
  )
  .put(
    "/:courseId/:moduleId/:lessonId",
    validateResource(updateContentInLessonSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(updateContentInLessonController),
    sendErrorResponse
  )
  .delete(
    "/:courseId/:moduleId/:lessonId",
    validateResource(deleteContentInLessonSchema),
    handleMiddlewarelError(verifyAuth),
    handleMiddlewarelError(deleteContentInLessonController)
  );
