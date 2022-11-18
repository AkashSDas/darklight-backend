import { Request, Response } from "express";

import { CourseModel } from "../models/course.model";
import * as services from "../services/course-profile.service";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";

// ==================================
// COURSE PAYMENT CONTROLLERS
// ==================================

// TODO: Add payment logic
/**
 * Create a new course profile for a user with this course and charge the user
 *
 * @route POST /api/course-profile/buy
 *
 * Middlewares used
 * - verifyAuth
 */
export async function buyCourseController(req: Request, res: Response) {
  var userId = req.user._id;
  var { courseId } = req.body;

  // Check if the course exists
  var course = await CourseModel.exists({ _id: courseId });
  if (!course) {
    throw new BaseApiError(404, "Course not found");
  }

  var exists = await services.courseProfileExistsService(userId, courseId);
  if (exists) {
    throw new BaseApiError(400, "Course already purchased");
  }

  var courseProfile = await services.createCourseProfileService(
    userId,
    courseId
  );
  return sendResponse(res, {
    status: 200,
    msg: "You're now enrolled in this course",
    data: courseProfile,
  });
}

// ==================================
// COURSE DATA CONTROLLERS
// ==================================

/**
 * Get the purchased course
 *
 * @route GET /api/course-profile/:userId/:courseId
 *
 * Middlewares used
 * - verifyAuth
 */
export async function courseProfileController(req: Request, res: Response) {
  var userId = req.user._id;
  var { courseId } = req.params;

  var courseProfile = await services.getCourseProfileService(userId, courseId);
  if (!courseProfile) {
    throw new BaseApiError(404, "Course not found");
  }

  if (courseProfile.user != userId) {
    throw new BaseApiError(403, "Unauthorized");
  }

  return sendResponse(res, {
    status: 200,
    msg: "Course profile fetched successfully",
    data: courseProfile,
  });
}

/**
 * Get all the purchased courses
 *
 * @route GET /api/course-profile/:userId
 *
 * Middlewares used
 * - verifyAuth
 */
export async function getCourseProfilesController(req: Request, res: Response) {
  var userId = req.user._id;

  var courseProfiles = await services.getCourseProfilesService(userId);
  return sendResponse(res, {
    status: 200,
    msg: "Course profiles fetched successfully",
    data: courseProfiles,
  });
}

// TODO: check the update
/**
 * Update the course profile
 *
 * @route PUT /api/course-profile/:userId/:courseId
 */
export async function updateCourseProfileController(
  req: Request,
  res: Response
) {
  var userId = req.user._id;
  var { courseId } = req.params;
  var update = req.body;

  var courseProfile = await services.updateCourseProfileService(
    userId,
    courseId,
    update
  );
  return sendResponse(res, {
    status: 200,
    msg: "Course profile updated successfully",
    data: courseProfile,
  });
}

// TODO: check lessonId to be valid
/**
 * Mark a lesson as done
 *
 * @route PUT /api/course-profile/:userId/:courseId/lesson/:lessonId
 *
 * Middlewares used
 * - verifyAuth
 */
export async function updateCourseProgressController(
  req: Request,
  res: Response
) {
  var userId = req.user._id;
  var { courseId, lessonId } = req.params;

  var courseProfile = await services.getCourseProfileService(userId, courseId);
  if (!courseProfile) {
    throw new BaseApiError(400, "Course not purchased");
  }
  if (courseProfile.progress.includes(lessonId as any)) {
    throw new BaseApiError(400, "Lesson already marked as done");
  }
  courseProfile.progress.push(lessonId as any);
  await courseProfile.save();

  return sendResponse(res, {
    status: 200,
    msg: "Course profile updated successfully",
    data: courseProfile,
  });
}
