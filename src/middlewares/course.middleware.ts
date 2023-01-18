import { NextFunction, Request, Response } from "express";

import { getCourseService } from "../services/course.service";

export async function validateCourseOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  var user = req.user;
  var course = await getCourseService({ _id: req.params.courseId });
  if (!course) return res.status(404).json({ message: "Course not found" });
  if (course.instructors.includes(user._id)) {
    req.course = course;
    return next(); // user is an instructor of the course
  }

  return res.status(403).json({ message: "Unauthorized" });
}
