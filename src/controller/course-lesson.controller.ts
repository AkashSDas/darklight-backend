import { Request, Response } from "express";

import { createCourseLessonService, deleteCourseLessonService, getCourseLessonService } from "../services/course-lesson.service";
import { sendResponse } from "../utils/client-response";
import { batchUpdateCourseAndLessonEditTime, validateCourseAndOwnership, validateCourseLesson } from "../utils/course";
import { BaseApiError } from "../utils/handle-error";
import { AddContent, CreateLesson, DeleteLesson, UpdateContent, UpdateLessonMetadata } from "../zod-schema/course-lesson.schema";

// ==================================
// LESSON CONTROLLERS
// ==================================

// TODO: add module check middleware
/**
 * Create a lesson and add it to the "module.lessons" list in the course
 *
 * @route POST /api/course/:courseId/:moduleId
 *
 * Middlewares used
 * - verifyAuth
 */
export async function createLessonController(
  req: Request<CreateLesson["params"]>,
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
    data: lesson,
  });
}

// TODO: add zod schema
// TODO: add module check middleware
/**
 * Get a lesson
 *
 * @route GET /api/course/:courseId/:moduleId/:lessonId
 */
export async function getLessonController(req: Request, res: Response) {
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
  if (!lesson) throw new BaseApiError(404, "Lesson not found");

  sendResponse(res, {
    status: 201,
    msg: "Lesson fetched successfully",
    data: lesson,
  });
}

// TODO: add module check middleware
/**
 * Update lesson's metadata (everything except content)
 *
 * @route PUT /api/course/:courseId/:moduleId/:lessonId/metadata
 *
 * Middlewares used
 * - verifyAuth
 */
export async function updateLessonMetadataController(
  req: Request<
    UpdateLessonMetadata["params"],
    {},
    UpdateLessonMetadata["body"]
  >,
  res: Response
) {
  var { course } = await validateCourseLesson(req, res);
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
  var { description, emoji, title, isFree } = req.body;

  lesson.title = title;
  lesson.description = description;
  lesson.emoji = emoji;
  lesson.isFree = isFree;
  lesson.updateLastEditedOn();

  await lesson.save();

  // Update course last edited on
  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Lesson metadata updated successfully",
    data: lesson,
  });
}

// TODO: add module check middleware
/**
 * Delete lesson
 *
 * @route DELETE /api/course/:courseId/:moduleId/:lessonId
 *
 * Middlewares used
 * - verifyAuth
 */
export async function deleteLessonController(
  req: Request<DeleteLesson["params"]>,
  res: Response
) {
  var { course } = await validateCourseLesson(req, res);
  var lesson = await deleteCourseLessonService({ _id: req.params.lessonId });
  course.deleteLesson(lesson.id);
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Lesson deleted successfully",
  });
}

// ==================================
// CONTENT CONTROLLERS
// ==================================

/**
 * Add content block to the lesson
 *
 * @route POST /api/course/:courseId/:moduleId/:lessonId
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyLessonOwnership
 */
export async function addContentController(
  req: Request<AddContent["params"], {}, AddContent["body"]>,
  res: Response
) {
  var course = req.course;
  var lesson = req.lesson;
  var { type, addAt, data } = req.body as any;

  // Check if trying to content at a valid index. If adding a new
  // content at the end, then addAt will be equal to the length of
  // the lesson contents
  if (addAt > lesson.contents.length) {
    throw new BaseApiError(400, "Add at is out of bounds");
  }

  lesson.addContent(type, addAt, data);
  await batchUpdateCourseAndLessonEditTime(lesson, course, function () {
    sendResponse(res, {
      status: 201,
      msg: "Content added to lesson successfully",
      data: { contents: lesson.contents },
    });
  });
}

/**
 * Update content block in the lesson
 *
 * @route PUT /api/course/:courseId/:moduleId/:lessonId
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyLessonOwnership
 */
export async function updateContentController(
  req: Request<UpdateContent["params"], {}, UpdateContent["body"]>,
  res: Response
) {
  var course = req.course;
  var lesson = req.lesson;
  var { updateAt, data } = req.body as any;

  // Check if trying to update at a valid index
  if (updateAt >= lesson.contents.length) {
    throw new BaseApiError(400, "Update at is out of bounds");
  }

  lesson.updateContent(updateAt, data);
  await batchUpdateCourseAndLessonEditTime(lesson, course, function () {
    sendResponse(res, {
      status: 200,
      msg: "Content updated in lesson successfully",
      data: { contents: lesson.contents },
    });
  });
}

/**
 * Reorder content blocks in the lesson
 *
 * @route PUT /api/course/:courseId/:moduleId/:lessonId/reorder
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyLessonOwnership
 */
export async function reorderContentController(req: Request, res: Response) {
  var course = req.course;
  var lesson = req.lesson;
  var { content } = req.body as any;

  try {
    lesson.updateContentOrder(content);
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  await (lesson as any).save();
  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Content reordered successfully",
    data: { contents: lesson.contents },
  });
}

/**
 * Delete content block from the lesson
 *
 * @route DELETE /api/course/:courseId/:moduleId/:lessonId/reorder
 *
 * Middlewares used
 * - verifyAuth
 * - verifyInstructor
 * - verifyLessonOwnership
 */
export async function deleteContentController(
  req: Request<UpdateContent["params"]>,
  res: Response
) {
  var course = req.course;
  var lesson = req.lesson;
  var { deleteAt } = req.body as any;

  // Check if trying to delete at a valid index
  if (deleteAt >= lesson.contents.length) {
    throw new BaseApiError(400, "Delete at is out of bounds");
  }

  lesson.deleteContent(deleteAt);
  await batchUpdateCourseAndLessonEditTime(lesson, course, function () {
    sendResponse(res, {
      status: 200,
      msg: "Content deleted in lesson successfully",
      data: { contents: lesson.contents },
    });
  });
}
