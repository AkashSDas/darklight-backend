import { Request, Response } from "express";

import { UserRole } from "../models/user.model";
import { createCourseService } from "../services/course.service";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";

export async function createCourseController(req: Request, res: Response) {
  // Check if the user exists
  var user = req.user;
  if (!user) throw new BaseApiError(404, "User not found");

  // Check if the user has the required permissions
  if (!user.roles.includes(UserRole.INSTRUCTOR)) {
    throw new BaseApiError(403, "You don't have the required permissions");
  }

  // Create the course
  var course = await createCourseService({ instructors: [user._id] });
  return sendResponse(res, {
    status: 201,
    msg: "Course created successfully",
    data: { course },
  });
}
