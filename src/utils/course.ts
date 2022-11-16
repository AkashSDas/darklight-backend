import { Request, Response } from "express";
import { startSession, Types } from "mongoose";

import { getCourseService } from "../services/course.service";
import { BaseApiError } from "./handle-error";
import logger from "./logger";

export async function validateCourseAndOwnership(req: Request, res: Response) {
  // Check if the course exists and the user is an instructor of this course
  var user = req.user;
  if (!user) throw new BaseApiError(404, "User not found");
  var course = await getCourseService({ _id: req.params.courseId });
  if (!course) throw new BaseApiError(404, "Course not found");
  if (!course.instructors.includes(user._id)) {
    throw new BaseApiError(403, "You don't have the required permissions");
  }

  return course;
}

export async function validateCourseLesson(req: Request, res: Response) {
  var course = await validateCourseAndOwnership(req, res);

  // Check if the moudle and lesson exists
  var { moduleId, lessonId } = req.params;

  var moduleIdx = course.modules.findIndex(function findModule(m) {
    return m.id == moduleId;
  });
  if (moduleIdx == -1) throw new BaseApiError(404, "Module not found");

  var lessonIdx = course.modules[moduleIdx].lessons.findIndex(
    function findLesson(lsn) {
      return typeof lsn == "string" ? lsn == lessonId : lsn.id == lessonId;
    }
  );
  if (lessonIdx == -1) throw new BaseApiError(404, "Lesson not found");

  return { course, moduleIdx, lessonIdx };
}

/** TODO: Fix input types */
export async function batchUpdateCourseAndLessonEditTime(
  course: any,
  lesson: any,
  callback: Function
) {
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

    callback();
  } catch (error) {
    logger.error(error);
    await session.abortTransaction();
    throw error;
  }
}
