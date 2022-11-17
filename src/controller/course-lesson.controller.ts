import { Request, Response } from "express";

import { createCourseLessonService, deleteCourseLessonService, getCourseLessonService } from "../services/course-lesson.service";
import { getAllCoursesService, getCourseService } from "../services/course.service";
import { sendResponse } from "../utils/client-response";
import { batchUpdateCourseAndLessonEditTime, validateCourseAndOwnership, validateCourseLesson } from "../utils/course";
import { BaseApiError } from "../utils/handle-error";
import { ZodAddContentInLesson, ZodCreateCourseLesson, ZodUpdateContentInLesson, ZodUpdateLessonMetadata } from "../zod-schema/course-lesson.schema";
import { GetCourse } from "../zod-schema/course.schema";

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
    data: lesson,
  });
}

// TODO: move this to course.controller.ts
export async function getCourseController(
  req: Request<GetCourse["params"]>,
  res: Response
) {
  var course = await getCourseService({ _id: req.params.courseId }, true);
  if (!course) throw new BaseApiError(404, "Course not found");

  return sendResponse(res, {
    status: 200,
    msg: "Course fetched successfully",
    data: course,
  });
}

// TODO: add zod schema
export async function getLessonController(req: Request, res: Response) {
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
  if (!lesson) throw new BaseApiError(404, "Lesson not found");

  sendResponse(res, {
    status: 201,
    msg: "Content added to lesson successfully",
    data: lesson,
  });
}

export async function updateLessonMetadataController(
  req: Request<
    ZodUpdateLessonMetadata["params"],
    {},
    ZodUpdateLessonMetadata["body"]
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

export async function deleteLessonController(
  req: Request<ZodUpdateLessonMetadata["params"]>,
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

// =============================
// Content related controllers
// =============================

// TODO: Test batch update
export async function addContentInLessonController(
  req: Request<
    ZodAddContentInLesson["params"],
    {},
    ZodAddContentInLesson["body"]
  >,
  res: Response
) {
  var course = await validateCourseAndOwnership(req, res);
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
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

export async function updateContentInLessonController(
  req: Request<
    ZodUpdateContentInLesson["params"],
    {},
    ZodUpdateContentInLesson["body"]
  >,
  res: Response
) {
  var { course } = await validateCourseLesson(req, res);
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
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

export async function deleteContentInLessonController(
  req: Request<ZodUpdateContentInLesson["params"]>,
  res: Response
) {
  var { course } = await validateCourseLesson(req, res);
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
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

export async function reorderContentController(req: Request, res: Response) {
  var { course } = await validateCourseLesson(req, res);
  var lesson = await getCourseLessonService({ _id: req.params.lessonId });
  var { content } = req.body as any;

  try {
    lesson.updateContentOrder(content);
  } catch (err) {
    if (err instanceof BaseApiError) throw err;
  }

  await lesson.save();
  course.updateLastEditedOn();
  await course.save();

  return sendResponse(res, {
    status: 200,
    msg: "Content reordered successfully",
    data: { contents: lesson.contents },
  });
}

export async function getCoursesController(req: Request, res: Response) {
  const LIMIT = 2;
  var next = req.query.next as string;
  var courses = await getAllCoursesService(LIMIT, next);

  return sendResponse(res, {
    status: 200,
    msg: "Courses fetched successfully",
    data: courses,
  });
}
