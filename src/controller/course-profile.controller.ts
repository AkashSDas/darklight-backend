import { Request, Response } from "express";

import {
  courseProfileExistsService,
  createCourseProfileService,
  getCourseProfileService,
  getCourseProfilesService,
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
