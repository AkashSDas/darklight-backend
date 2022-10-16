import { Request, Response } from "express";

import { getCourseService } from "../services/course.service";
import { BaseApiError } from "./handle-error";

export async function validateCourseAndOwnership(req: Request, res: Response) {
  // Check if the course exists and the user is an instructor of this course
  var user = req.user;
  if (!user) throw new BaseApiError(404, "User not found");
  var course = await getCourseService({ _id: req.params.courseId });
  if (!course) throw new BaseApiError(404, "Course not found");
  if (!course.instructors.includes(user._id)) {
    throw new BaseApiError(403, "You don't have the required permissions");
  }

  return course;
}
