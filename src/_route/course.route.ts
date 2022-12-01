import { Router } from "express";

import * as ctrl from "../_controller/course.controller";
import * as groupCtrl from "../_controller/group.controller";
import * as lessonAttachmentCtrl from "../_controller/lesson-attachment.controller";
import * as lessonContentCtrl from "../_controller/lesson-content.controller";
import * as lessonCtrl from "../_controller/lesson.controller";
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
  handleMiddlewareError(groupCtrl.addGroupController),
  sendErrorResponse
);

// Update group
router.put(
  "/:courseId/group/:groupId",
  validateResource(z.updateGroupSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(groupCtrl.updateGroupController),
  sendErrorResponse
);

// Reorder lessons
router.put(
  "/:courseId/group/:groupId/reorder",
  validateResource(z.reorderLessonsSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(groupCtrl.reorderLessonsController),
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
  handleMiddlewareError(lessonCtrl.createLessonController),
  sendErrorResponse
);

// Update lesson settings
router.put(
  "/:courseId/group/:groupId/lesson/:lessonId/settings",
  validateResource(z.updateLessonSettingsSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonCtrl.updateLessonSettingsController),
  sendErrorResponse
);

// Update lesson video
router.post(
  "/:courseId/group/:groupId/lesson/:lessonId/video",
  validateResource(z.updateLessonVideoSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonCtrl.updateLessonVideoController),
  sendErrorResponse
);

// Remove lesson video
router.delete(
  "/:courseId/group/:groupId/lesson/:lessonId/video",
  validateResource(z.updateLessonVideoSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonCtrl.removeLessonVideoController),
  sendErrorResponse
);

// Move lesson to another group
router.put(
  "/:courseId/group/:groupId/lesson/:lessonId/move",
  validateResource(z.moveLessonToAnotherGroupSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonCtrl.moveLessonToAnotherGroupController),
  sendErrorResponse
);

// Delete lesson
router.delete(
  "/:courseId/group/:groupId/lesson/:lessonId",
  validateResource(z.deleteLessonSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonCtrl.deleteLessonController),
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
  handleMiddlewareError(lessonContentCtrl.createContentController),
  sendErrorResponse
);

// Reorder content
router.put(
  "/:courseId/group/:groupId/lesson/:lessonId/content/reorder",
  validateResource(z.reorderContentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonContentCtrl.reorderContentController),
  sendErrorResponse
);

// Update content
router.put(
  "/:courseId/group/:groupId/lesson/:lessonId/content/:contentId",
  validateResource(z.updateContentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonContentCtrl.updateContentController),
  sendErrorResponse
);

// Delete content
router.delete(
  "/:courseId/group/:groupId/lesson/:lessonId/content/:contentId",
  validateResource(z.updateContentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonContentCtrl.deleteContentController),
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
  handleMiddlewareError(lessonAttachmentCtrl.addAttachmentController),
  sendErrorResponse
);

// Remove attachment
router.delete(
  "/:courseId/group/:groupId/lesson/:lessonId/attachment",
  validateResource(z.removeAttachmentSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonAttachmentCtrl.removeAttachmentController),
  sendErrorResponse
);