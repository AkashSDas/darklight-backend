import { NextFunction, Request, Response } from "express";

import { getCourseLessonService } from "../services/course-lesson.service";
import { getCourseService } from "../services/course.service";
import { BaseApiError } from "../utils/handle-error";

export default async function verifyLessonOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  var user = req.user;
  if (!user) throw new BaseApiError(400, "You're not logged in");

  var course = await getCourseService({ _id: req.params.courseId });
  if (!course) throw new BaseApiError(404, "Course not found");

  // This verifies whether the user is the owner of the course
  // This also confirms that the user has "instructor" role
  if (!course.instructors.includes(user._id)) {
    throw new BaseApiError(403, "You don't have the required permissions");
  }

  // Get the module
  var module = course.modules.find((m) => m.id == req.params.moduleId);
  if (!module) throw new BaseApiError(404, "Module not found");

  // Get the lesson
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
  if (!lesson) throw new BaseApiError(404, "Lesson not found");

  req.course = course;
  req.module = module;
  req.lesson = lesson;
  next();
}
