import { Request, Response } from "express";

import { UserRole } from "../models/user.model";
import { createCourseService, getCourseService } from "../services/course.service";
import { sendResponse } from "../utils/client-response";
import { validateCourseAndOwnership } from "../utils/course";
import { BaseApiError } from "../utils/handle-error";
import { ZodAddModuleToCourse, ZodDeleteCourseModule, ZodReorderLessonsInModule, ZodUpdateCourse, ZodUpdateCourseModule } from "../zod-schema/course.schema";

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
    data: course,
  });
}

export async function updateCourseInfoController(
  req: Request<ZodUpdateCourse["params"], {}, ZodUpdateCourse["body"]>,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);
  var { emoji, description, difficulty, price, stage, tags, title } = req.body;
  if (emoji) course.emoji = emoji;
  if (description) course.description = description;
  if (difficulty) course.difficulty = difficulty as any;
  if (price) course.price = price;
  if (stage) course.stage = stage as any;
  if (tags) course.tags = tags;
  if (title) course.title = title;

  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Course updated successfully",
    data: course,
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
    ZodUpdateCourseModule["params"],
    {},
    ZodUpdateCourseModule["body"]
  >,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);

  // Update course module
  try {
    var module = course.updateModule(req.params.moduleId, { ...req.body });
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

export async function reorderLessonsInModuleController(
  req: Request<
    ZodReorderLessonsInModule["params"],
    {},
    ZodReorderLessonsInModule["body"]
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
