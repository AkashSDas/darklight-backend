import { Router } from "express";
import { updateSettings } from "../_controller/course.controller";
import verifyAuth from "../_middlewares/auth.middleware";
import { handleMiddlewareError } from "../_utils/async.util";
import { sendErrorResponse } from "../_utils/error.util";

export var router = Router();

// ==================================
// COURSE
// ==================================

// Update course settings
router.put(
  "/:courseId/settings",
  handleMiddlewareError(verifyAuth),
  handleMiddlewareError(updateSettings),
  sendErrorResponse
);
