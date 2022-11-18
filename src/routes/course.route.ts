import { Router } from "express";

import * as lessonCtrl from "../controller/course-lesson.controller";
import * as courseCtrl from "../controller/course.controller";
import { validateResource } from "../middlewares/validate-resource";
import verifyAuth from "../middlewares/verify-auth";
import verifyCourseOwnership from "../middlewares/verify-course-ownership";
import verifyInstructor from "../middlewares/verify-instructor";
import verifyLessonOwnership from "../middlewares/verify-lesson-ownership";
import verifyModuleOwnership from "../middlewares/verify-module-ownership";
import { handleMiddlewarelError } from "../utils/handle-async";
import { sendErrorResponse } from "../utils/handle-error";
import * as schema from "../zod-schema/course-lesson.schema";
import * as z from "../zod-schema/course.schema";

export var router = Router();

// ==================================
// COURSE ROUTES
// ==================================

// Create course
router.post(
  "/",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(courseCtrl.createCourseController),
  sendErrorResponse
);

// Update course metadata
router.put(
  "/:courseId/info",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyCourseOwnership),
  handleMiddlewarelError(courseCtrl.updateCourseMetadataController),
  sendErrorResponse
);

// Delete course
router.delete(
  "/:courseId",
  validateResource(z.deleteCourseSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyCourseOwnership),
  handleMiddlewarelError(courseCtrl.deleteCourseController),
  sendErrorResponse
);

// Reorder modules
router.put(
  "/:courseId/reorder",
  validateResource(z.reorderModulesSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyCourseOwnership),
  handleMiddlewarelError(courseCtrl.reorderModulesController),
  sendErrorResponse
);

// Fetch course
router
  .get(
    "/all",
    handleMiddlewarelError(courseCtrl.getCoursesController),
    sendErrorResponse
  )
  .get(
    "/:courseId",
    validateResource(z.getCourseSchema),
    handleMiddlewarelError(courseCtrl.getCourseController),
    sendErrorResponse
  );

// ==================================
// MODULE ROUTES
// ==================================

// Add module to the course
router.post(
  "/:courseId",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyCourseOwnership),
  handleMiddlewarelError(courseCtrl.addModuleController),
  sendErrorResponse
);

// Update module
router.put(
  "/:courseId/:moduleId",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyModuleOwnership),
  handleMiddlewarelError(courseCtrl.updateModuleController),
  sendErrorResponse
);

// Get module
router.get(
  "/:courseId/:moduleId",
  handleMiddlewarelError(courseCtrl.getModuleController),
  sendErrorResponse
);

// Delete module
router.delete(
  "/:courseId/:moduleId",
  validateResource(z.deleteModuleSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyModuleOwnership),
  handleMiddlewarelError(courseCtrl.deleteModuleController),
  sendErrorResponse
);

// Reorder lessons
router.put(
  "/:courseId/:moduleId/reorder",
  validateResource(z.reorderLessonsSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyModuleOwnership),
  handleMiddlewarelError(courseCtrl.reorderLessonsController),
  sendErrorResponse
);

// ==================================
// LESSONS ROUTES
// ==================================

// Create lesson
router.post(
  "/:courseId/:moduleId",
  validateResource(schema.createLessonSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(lessonCtrl.createLessonController),
  sendErrorResponse
);

// Get lesson
router.get(
  "/:courseId/:moduleId/:lessonId",
  handleMiddlewarelError(lessonCtrl.getLessonController),
  sendErrorResponse
);

// Update lesson's metadata
router.put(
  "/:courseId/:moduleId/:lessonId/metadata",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(lessonCtrl.updateLessonMetadataController),
  sendErrorResponse
);

// Delete lesson
router.delete(
  "/:courseId/:moduleId/:lessonId/delete",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(lessonCtrl.deleteLessonController)
);

// ==================================
// CONTENT ROUTES
// ==================================

// Add content block
router.post(
  "/:courseId/:moduleId/:lessonId",
  validateResource(schema.addContentSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyLessonOwnership),
  handleMiddlewarelError(lessonCtrl.addContentController),
  sendErrorResponse
);

// Update content block
router.put(
  "/:courseId/:moduleId/:lessonId",
  validateResource(schema.updateContentSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyLessonOwnership),
  handleMiddlewarelError(lessonCtrl.updateContentController),
  sendErrorResponse
);

// Reorder content blocks in lesson
router.put(
  "/:courseId/:moduleId/:lessonId/reorder",
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyLessonOwnership),
  handleMiddlewarelError(lessonCtrl.reorderContentController),
  sendErrorResponse
);

// Delete content block
router.delete(
  "/:courseId/:moduleId/:lessonId",
  validateResource(schema.deleteContentSchema),
  handleMiddlewarelError(verifyAuth),
  handleMiddlewarelError(verifyInstructor),
  handleMiddlewarelError(verifyLessonOwnership),
  handleMiddlewarelError(lessonCtrl.deleteContentController)
);
