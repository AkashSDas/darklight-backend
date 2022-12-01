import { Router } from "express";

import * as ctrl from "../_controller/course.controller";
import verifyAuth from "../_middlewares/auth.middleware";
import { validateResource } from "../_middlewares/zod.middleware";
import * as z from "../_schema/course.schema";
import { handleMiddlewareError } from "../_utils/async.util";
import { sendErrorResponse } from "../_utils/error.util";

export var router = Router();

// ==================================
// COURSE
// ==================================

// Create course
router.post(
  "",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.createCourseController)
);

// Update course settings
router.put(
  "/:courseId/settings",
  validateResource(z.courseSettingsSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateCourseSettingsController),
  sendErrorResponse
);

// Update course cover image
router.put(
  "/:courseId/cover",
  validateResource(z.updateCourseCoverSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateCourseCoverController),
  sendErrorResponse
);

// Get a course
router.get(
  "/:courseId",
  validateResource(z.getCourseSchema),
  handleMiddlewareError(ctrl.getCourseController),
  sendErrorResponse
);

// Get all courses
router.get(
  "",
  handleMiddlewareError(ctrl.getCoursesController),
  sendErrorResponse
);

// ==================================
// GROUP
// ==================================

// Add group
router.post(
  "/:courseId/group",
  validateResource(z.addGroupSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.addGroupController),
  sendErrorResponse
);

// Update group
router.put(
  "/:courseId/group/:groupId",
  validateResource(z.updateGroupSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateGroupController),
  sendErrorResponse
);

// Reorder lessons
router.put(
  "/:courseId/group/:groupId/reorder",
  validateResource(z.reorderLessonsSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.reorderLessonsController),
  sendErrorResponse
);

// ==================================
// LESSON
// ==================================

// Add lesson
router.post(
  "/:courseId/group/:groupId/lesson",
  validateResource(z.createLessonSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.createLessonController),
  sendErrorResponse
);

// Update lesson settings
router.put(
  "/:courseId/group/:groupId/lesson/:lessonId/settings",
  validateResource(z.updateLessonSettingsSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateLessonSettingsController),
  sendErrorResponse
);

// Update lesson video
router.post(
  "/:courseId/group/:groupId/lesson/:lessonId/video",
  validateResource(z.updateLessonVideoSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateLessonVideoController),
  sendErrorResponse
);

// Remove lesson video
router.delete(
  "/:courseId/group/:groupId/lesson/:lessonId/video",
  validateResource(z.updateLessonVideoSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.removeLessonVideoController),
  sendErrorResponse
);

// Move lesson to another group
router.put(
  "/:courseId/group/:groupId/lesson/:lessonId/move",
  validateResource(z.moveLessonToAnotherGroupSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.moveLessonToAnotherGroupController),
  sendErrorResponse
);

// ==================================
// CONTENT
// ==================================

// Add content
router.post(
  "/:courseId/group/:groupId/lesson/:lessonId/content",
  validateResource(z.createContentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.createContentController),
  sendErrorResponse
);

// Reorder content
router.put(
  "/:courseId/group/:groupId/lesson/:lessonId/content/reorder",
  validateResource(z.reorderContentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.reorderContentController),
  sendErrorResponse
);

// Update content
router.put(
  "/:courseId/group/:groupId/lesson/:lessonId/content/:contentId",
  validateResource(z.updateContentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateContentController),
  sendErrorResponse
);

// Delete content
router.delete(
  "/:courseId/group/:groupId/lesson/:lessonId/content/:contentId",
  validateResource(z.updateContentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.deleteContentController),
  sendErrorResponse
);

// ==================================
// ATTACHMENT
// ==================================

// Add attachment
router.post(
  "/:courseId/group/:groupId/lesson/:lessonId/attachment",
  validateResource(z.addAttachmentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.addAttachmentController),
  sendErrorResponse
);