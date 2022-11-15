import { Request, Response } from "express";

import { createCourseProfileService } from "../services/course-profile.service";
import { sendResponse } from "../utils/client-response";

// TODO: Add payment logic
export async function buyCourseController(req: Request, res: Response) {
  var { courseId, userId } = req.body;
  var courseProfile = await createCourseProfileService(userId, courseId);
  return sendResponse(res, {
    status: 200,
    msg: "You're now enrolled in this course",
    data: courseProfile,
  });
}
