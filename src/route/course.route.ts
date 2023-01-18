import { Router } from "express";

import * as ctrl from "../controller/course.controller";
import * as groupCtrl from "../controller/group.controller";
import * as lessonAttachmentCtrl from "../controller/lesson-attachment.controller";
import * as lessonContentCtrl from "../controller/lesson-content.controller";
import * as lessonCtrl from "../controller/lesson.controller";
import verifyAuth from "../middlewares/auth.middleware";
import { validateResource } from "../middlewares/zod.middleware";
import * as z from "../schema/course.schema";
import { handleMiddlewareError } from "../utils/async.util";
import { sendErrorResponse } from "../utils/error.util";

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

// Reorder groups
router.put(
  "/:courseId/reorder",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.reorderGroupsController),
  sendErrorResponse
);

// Get a course
router.get(
  "/:courseId",
  validateResource(z.getCourseSchema),
  handleMiddlewareError(ctrl.getCourseController),
  sendErrorResponse
);

// Get editable course
router.get(
  "/:courseId/editable",
  validateResource(z.getCourseSchema),
  handleMiddlewareError(ctrl.getEditableCourseController),
  sendErrorResponse
);

// Get all courses
router.get(
  "",
  handleMiddlewareError(ctrl.getCoursesController),
  sendErrorResponse
);

// Delete course
router.delete(
  "/:courseId",
  validateResource(z.deleteCourseSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.deleteCourseController),
  sendErrorResponse
);

// Publish course
router.put(
  "/:courseId/status",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateCourseStatusController),
  sendErrorResponse
);

// Get all courses authored by the user
router.get(
  "/:userId/authored-courses",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.getInstructorCoursesController),
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

// Delete group
router.delete(
  "/:courseId/group/:groupId",
  validateResource(z.deleteGroupSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(groupCtrl.deleteGroupController),
  sendErrorResponse
);

// ==================================
// LESSON
// ==================================

// Get lesson
router.get(
  "/:courseId/group/:groupId/lesson/:lessonId",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(lessonCtrl.getLessonController),
  sendErrorResponse
);

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
