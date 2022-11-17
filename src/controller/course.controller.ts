import { Request, Response } from "express";
import { startSession } from "mongoose";

import { CourseLessonModel } from "../models/course-lesson.model";
import { createCourseService, getCourseService } from "../services/course.service";
import { sendResponse } from "../utils/client-response";
import { validateCourseAndOwnership } from "../utils/course";
import { BaseApiError } from "../utils/handle-error";
import * as zod from "../zod-schema/course.schema";

// ==================================
// COURSE CONTROLLERS
// ==================================

/**
 * Create a new empty course
 *
 * @route POST /api/course
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 */
export async function createCourseController(req: Request, res: Response) {
  var user = req.user;
  var course = await createCourseService({ instructors: [user._id] });

  return sendResponse(res, {
    status: 201,
    msg: "Course created",
    data: course,
  });
}

// TODO: add validation of req.body
// TODO: optimize the async/await
/**
 * Update course metadata
 *
 * @route PUT /api/course/:courseId
 * @remark Req body schema isn't validated
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyCourseOwnership
 */
export async function updateCourseMetadataController(
  req: Request<
    zod.UpdateCourseMetadata["params"],
    {},
    zod.UpdateCourseMetadata["body"]
  >,
  res: Response
) {
  var course = req.course;
  course.updateMetadata(req.body as any); // values validated by zod schema
  course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Course metadata updated",
    data: course,
  });
}

export async function deleteCourseController(
  req: Request<zod.DeleteCourse["params"]>,
  res: Response
) {
  var course = req.course;
  var lessons = course.getAllLessons();
  var session = await startSession();
  session.startTransaction();

  try {
    await course.delete({ session });
    await CourseLessonModel.deleteMany({ _id: { $in: lessons } }, { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  }

  session.endSession();
  return sendResponse(res, {
    status: 200,
    msg: "Course deleted successfully",
  });
}

export async function addModuleToCourseController(
  req: Request<zod.ZodAddModuleToCourse["params"]>,
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
    msg: "Module created",
    data: course.modules[course.modules.length - 1],
  });
}

export async function getCourseMoudelController(req: Request, res: Response) {
  // Check if the course exists and the user is an instructor of this course
  var course = await getCourseService({ _id: req.params.courseId });
  if (!course) throw new BaseApiError(404, "Course not found");

  // Get the module
  var module = course.modules.find((m) => m.id == req.params.moduleId);
  if (!module) throw new BaseApiError(404, "Module not found");

  return sendResponse(res, {
    status: 200,
    msg: "Module fetched successfully",
    data: module,
  });
}

/**
 * This will handle single field update for a module. This means that it
 * will also handle reordering of the modules.
 */
export async function updateCourseModuleController(
  req: Request<
    zod.ZodUpdateCourseModule["params"],
    {},
    zod.ZodUpdateCourseModule["body"]
  >,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);

  // Update course module
  try {
    var module = course.updateModule(req.params.moduleId, {
      emoji: req.body.emoji,
      title: req.body.title,
      description: req.body.description,
      lessons: req.body.lessons,
    });
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Course module updated successfully",
    data: { module },
  });
}

export async function deleteCourseModuleController(
  req: Request<zod.ZodDeleteCourseModule["params"]>,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);

  // Update course module
  try {
    var lessons = course.deleteModule(req.params.moduleId);
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  var session = await startSession();
  session.startTransaction();

  course.updateLastEditedOn();

  try {
    if (lessons) {
      await CourseLessonModel.deleteMany(
        { _id: { $in: lessons } },
        { session }
      );
      await course.save({ session });
    }
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  return sendResponse(res, {
    status: 200,
    msg: "Course module deleted successfully",
  });
}

export async function reorderLessonsInModuleController(
  req: Request<
    zod.ZodReorderLessonsInModule["params"],
    {},
    zod.ZodReorderLessonsInModule["body"]
  >,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);

  // Update course module
  try {
    course.updateModule(req.params.moduleId, { lessons: req.body.lessons });
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Lessons reordered successfully",
    data: { modules: course.modules },
  });
}

// TODO: add zod schema and validation
export async function reorderModulesController(req: Request, res: Response) {
  var course = await validateCourseAndOwnership(req, res);

  // Update course module
  try {
    course.updateModules(req.body.modules);
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Modules reordered successfully",
    data: { modules: course.modules },
  });
}
