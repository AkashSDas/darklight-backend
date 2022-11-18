import { Request, Response } from "express";
import { startSession, Types } from "mongoose";

import { CourseLessonModel } from "../models/course-lesson.model";
import { ModuleMetadata } from "../models/course.model";
import * as services from "../services/course.service";
import { sendResponse } from "../utils/client-response";
import { BaseApiError } from "../utils/handle-error";
import * as z from "../zod-schema/course.schema";

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
  var course = await services.createCourseService({ instructors: [user._id] });

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
    z.UpdateCourseMetadata["params"],
    {},
    z.UpdateCourseMetadata["body"]
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

/**
 * Delete course with all its lessons
 *
 * @route DELETE /api/course/:courseId
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyCourseOwnership
 */
export async function deleteCourseController(
  req: Request<z.DeleteCourse["params"]>,
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

// TODO: Fix response data
// TODO: fix module reordering technique
/**
 * Rorder modules in the course
 *
 * @route PUT /api/course/:courseId/reorder
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyCourseOwnership
 */
export async function reorderModulesController(req: Request, res: Response) {
  var course = req.course;

  // Update course module
  course.updateModules(req.body.modules);
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Modules reordered successfully",
    data: { modules: course.modules },
  });
}

/**
 * Get a course
 *
 * @route GET /api/course/:courseId
 * @remark Here the instructor and course lessons (only needed fields) are populated
 */
export async function getCourseController(
  req: Request<z.GetCourse["params"]>,
  res: Response
) {
  var course = await services.getCourseService(
    { _id: req.params.courseId },
    true
  );
  if (!course) throw new BaseApiError(404, "Course not found");

  return sendResponse(res, {
    status: 200,
    msg: "Course fetched successfully",
    data: course,
  });
}

/**
 * Get all the courses
 *
 * @route GET /api/course/all
 * @remark Here the instructor and course lessons (only needed fields) are populated
 */
export async function getCoursesController(req: Request, res: Response) {
  const LIMIT = 2;
  var next = req.query.next as string;
  var courses = await services.getAllCoursesService(LIMIT, next);

  return sendResponse(res, {
    status: 200,
    msg: "Courses fetched successfully",
    data: courses,
  });
}

// ==================================
// MODULE CONTROLLERS
// ==================================

/**
 * Add module to the course
 *
 * @route POST /api/course/:courseId
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyCourseOwnership
 */
export async function addModuleController(
  req: Request<z.AddModule["params"]>,
  res: Response
) {
  var course = req.course;
  course.addModule();
  await course.save();

  return sendResponse(res, {
    status: 201,
    msg: "Module added",
    data: course.modules[course.modules.length - 1],
  });
}

/**
 * Update module data in the course
 *
 * @route PUT /api/course/:courseId/:moduleId
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyModuleOwnership
 */
export async function updateModuleController(
  req: Request<z.UpdateModule["params"], {}, z.UpdateModule["body"]>,
  res: Response
) {
  var course = req.course;
  var payload: ModuleMetadata = {
    ...req.body,
    lessons: req.body.lessons.map((lesson) => new Types.ObjectId(lesson)),
  };

  course.updateModule(req.params.moduleId, payload);
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Module updated",
  });
}

/**
 * Get module from the course
 *
 * @route GET /api/course/:courseId/:moduleId
 */
export async function getModuleController(
  req: Request<z.GetModule["params"]>,
  res: Response
) {
  var course = await services.getCourseService({ _id: req.params.courseId });
  if (!course) throw new BaseApiError(404, "Course not found");

  var module = course.modules.find((m) => m.id == req.params.moduleId);
  if (!module) throw new BaseApiError(404, "Module not found");

  return sendResponse(res, {
    status: 200,
    msg: "Module fetched",
    data: module,
  });
}

/**
 * Delete module from the course along with its lessons
 *
 * @route DELETE /api/course/:courseId/:moduleId
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyModuleOwnership
 */
export async function deleteModuleController(
  req: Request<z.DeleteModule["params"]>,
  res: Response
) {
  var course = req.course;

  // Remove module from course and get lesson ids to delete
  try {
    var lessons = course.deleteModule(req.params.moduleId);
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  // Delete all the lessons in the module and update the course
  var session = await startSession();
  session.startTransaction();

  try {
    // Delete lessons
    if (lessons && lessons.length > 0) {
      await CourseLessonModel.deleteMany(
        { _id: { $in: lessons } },
        { session }
      );
    }

    // Save course
    await course.save({ session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  }

  session.endSession();

  return sendResponse(res, {
    status: 200,
    msg: "Module deleted",
  });
}

/**
 * Reorder lessons in a module
 *
 * @route PUT /api/course/:courseId/:moduleId/reorder
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyModuleOwnership
 */
export async function reorderLessonsController(
  req: Request<z.ReorderLessons["params"], {}, z.ReorderLessons["body"]>,
  res: Response
) {
  var course = req.course;
  course.updateModule(req.params.moduleId, {
    lessons: req.body.lessons.map((lesson) => new Types.ObjectId(lesson)),
  });

  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Lessons reordered successfully",
  });
}
