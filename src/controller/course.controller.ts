import { Request, Response } from "express";
import { startSession } from "mongoose";

import { UserRole } from "../models/user.model";
import { getCourseLessonService } from "../services/course-lesson.service";
import { createCourseService, getCourseService } from "../services/course.service";
import { sendResponse } from "../utils/client-response";
import { validateCourseAndOwnership } from "../utils/course";
import { BaseApiError } from "../utils/handle-error";
import logger from "../utils/logger";
import { ZodAddModuleToCourse, ZodDeleteCourseModule, ZodUpdateCourseModule } from "../zod-schema/course.schema";

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

export async function addModuleToCourseController(
  req: Request<ZodAddModuleToCourse["params"]>,
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

  // Create a module and add it to the course
  course.addModule();
  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 201,
    msg: "Lesson added to course successfully",
    data: { module: course.modules[course.modules.length - 1] },
  });
}

/**
 * This will handle single field update for a module. This means that it
 * will also handle reordering of the modules.
 */
export async function updateCourseModuleController(
  req: Request<
    ZodUpdateCourseModule["params"],
    {},
    ZodUpdateCourseModule["body"]
  >,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);

  // Update course module
  try {
    course.updateModule(req.params.moduleId, { ...req.body });
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Course module updated successfully",
    data: { module: course.modules[course.modules.length - 1] },
  });
}

export async function deleteCourseModuleController(
  req: Request<ZodDeleteCourseModule["params"]>,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);

  // Update course module
  try {
    course.deleteModule(req.params.moduleId);
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Course module deleted successfully",
  });
}

export async function reorderCourseLessonContentsController(
  req: Request,
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

  // Check if the lesson exists and is part of the course
  var exists = course.lessons.find(function checkLesson(lesson) {
    return lesson._id.toString() == req.params.lessonId;
  });
  if (!exists) throw new BaseApiError(404, "Lesson not found");

  // Update content in the lesson
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
  var { contents } = req.body;
  if (contents.length != lesson.contents.length) {
    throw new BaseApiError(400, "Invalid contents");
  }
  lesson.contents = contents;

  // Update the course/lesson last edited on. Saving lesson and course together
  var session = await startSession();
  session.startTransaction();
  try {
    lesson.updateLastEditedOn();
    course.updateLastEditedOn();

    // Don't use Promise.all here because it cause the transaction to fail
    // Error - Given transaction number does not match any in-progress transactions
    await lesson.save({ session });
    await course.save({ session });
    await session.commitTransaction();

    // Return the updated lesson contents
    return sendResponse(res, {
      status: 201,
      msg: "Lesson contents reordered successfully",
      data: { contents: lesson.contents },
    });
  } catch (error) {
    logger.error(error);
    await session.abortTransaction();
    throw error;
  }
}
