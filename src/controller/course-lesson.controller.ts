import { Request, Response } from "express";

import { createCourseLessonService } from "../services/course-lesson.service";
import { sendResponse } from "../utils/client-response";
import { validateCourseAndOwnership } from "../utils/course";
import { BaseApiError } from "../utils/handle-error";
import { ZodCreateCourseLesson } from "../zod-schema/course-lesson.schema";

export async function createCourseLessonController(
  req: Request<ZodCreateCourseLesson["params"]>,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);

  // Check if the moudle and lesson exists
  var idx = course.modules.findIndex(function findModule(m) {
    return m.id == req.params.moduleId;
  });
  if (idx == -1) throw new BaseApiError(404, "Module not found");

  // Create and save lesson, and update course module
  var lesson = await createCourseLessonService({});
  var module = course.modules[idx];
  module.lessons.push(lesson.id);
  course.modules[idx] = module;
  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 201,
    msg: "Lesson created successfully",
    data: { lesson },
  });
}
