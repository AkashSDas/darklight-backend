import { Request, Response } from "express";

import {
  courseProfileExistsService,
  createCourseProfileService,
  getCourseProfileService,
  getCourseProfilesService,
  updateCourseProfileService,
} from "../services/course-profile.service";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";

// TODO: Add payment logic
export async function buyCourseController(req: Request, res: Response) {
  var { courseId, userId } = req.body;

  var exists = await courseProfileExistsService(userId, courseId);
  if (exists) {
    throw new BaseApiError(400, "Course already purchased");
  }

  var courseProfile = await createCourseProfileService(userId, courseId);
  return sendResponse(res, {
    status: 200,
    msg: "You're now enrolled in this course",
    data: courseProfile,
  });
}

export async function getCourseProfileController(req: Request, res: Response) {
  var { courseId, userId } = req.params;

  var courseProfile = await getCourseProfileService(userId, courseId);
  return sendResponse(res, {
    status: 200,
    msg: "Course profile fetched successfully",
    data: courseProfile,
  });
}

export async function getCourseProfilesController(req: Request, res: Response) {
  var { userId } = req.params;

  var courseProfiles = await getCourseProfilesService(userId);
  return sendResponse(res, {
    status: 200,
    msg: "Course profiles fetched successfully",
    data: courseProfiles,
  });
}

// TODO: check the update
export async function updateCourseProfileController(
  req: Request,
  res: Response
) {
  var { courseId, userId } = req.params;
  var update = req.body;

  var courseProfile = await updateCourseProfileService(
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
export async function updateCourseProgressController(
  req: Request,
  res: Response
) {
  var { courseId, userId, lessonId } = req.params;

  var courseProfile = await getCourseProfileService(userId, courseId);
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
