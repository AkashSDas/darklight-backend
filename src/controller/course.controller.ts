import { Request, Response } from "express";

import { UserRole } from "../models/user.model";
import { createCourseService, getCourseService } from "../services/course.service";
import { createCourseLessonService } from "../services/course.service copy";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";
import { ZodAddLessonToCourse } from "../zod-schema/course.schema";

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

export async function addLessonToCourseController(
  req: Request<ZodAddLessonToCourse["params"]>,
  res: Response
) {
  // Check if the course exists and the user is an instructor of this course
  var user = req.user;
  if (!user) throw new BaseApiError(404, "User not found");
  var course = await getCourseService({ _id: req.params.courseId });
  if (!course) throw new BaseApiError(404, "Course not found");
  if (!course.instructors.includes(user._id)) {
    throw new BaseApiError(403, "You don't have the required permissions");
  }

  // Create a lesson and add it to the course
  var lesson = await createCourseLessonService({});
  course.lessons.push(lesson._id);
  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 201,
    msg: "Lesson added to course successfully",
    data: { lesson },
  });
}
