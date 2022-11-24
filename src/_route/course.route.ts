import { Router } from "express";
import * as ctrl from "../_controller/course.controller";
import verifyAuth from "../_middlewares/auth.middleware";
import { handleMiddlewareError } from "../_utils/async.util";
import { sendErrorResponse } from "../_utils/error.util";
import * as z from "../_schema/course.schema";
import { validateResource } from "../_middlewares/zod.middleware";

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
  validateResource(z.settingsSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateSettingsController),
  sendErrorResponse
);

// Update course cover image
router.put(
  "/:courseId/cover",
  validateResource(z.updateCoverImageSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.updateCoverImageController),
  sendErrorResponse
);

// ==================================
// GROUP
// ==================================

// Add group
router.post(
  "/:courseId/group",
  validateResource(z.createGroupSchema),
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(ctrl.createGroupController),
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
