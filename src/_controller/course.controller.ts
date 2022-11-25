import { Request, Response } from "express";
import { Course } from "../_models/course.model";
import * as z from "../_schema/course.schema";
import { UserRole } from "../_utils/user.util";
import { UploadedFile } from "express-fileupload";
import { updateCourseCoverImage } from "../_utils/course.util";
import mongoose, { startSession } from "mongoose";
import { Lesson } from "../_models/lesson.model";

// ==================================
// COURSE CONTROLLERS
// ==================================

/**
 * Create a brand new course
 *
 * @route POST /api/course
 *
 * @remark Middlewares used:
 * - verifyAuth
 */
export async function createCourseController(req: Request, res: Response) {
  var user = req.user;
  if (!(user.roles as UserRole[]).includes(UserRole.TEACHER)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var course = new Course();
  course.instructors.push(user._id);
  await course.save();

  return res.status(201).json({ course });
}

/**
 * Update course settings
 *
 * @remark Settings that are updated are:
 * - emoji
 * - title
 * - description
 * - stage
 * - price
 * - difficulty
 * - tags
 * - faqs
 *
 * @route PUT /api/course/:courseId/settings
 *
 * @remark Middlewares used:
 * - verifyAuth
 *
 * @remark Verification of course ownership is done by the query for getting
 * the course
 *
 * @remark This makes 1 request to the db
 */
export async function updateSettingsController(
  req: Request<z.Settings["params"], {}, z.Settings["body"]>,
  res: Response
) {
  // This check whether the course exists and whether the user is an instructor
  var course = await Course.findOneAndUpdate(
    { _id: req.params.courseId, instructors: req.user._id },
    { $set: { ...req.body } },
    { new: true, fields: "-__v" }
  );

  if (!course) return res.status(404).json({ message: "Course not found" });
  return res.status(200).json({ course });
}

/**
 * Update course cover image
 *
 * @route PUT /api/course/:courseId/cover
 *
 * @remark Middlewares used:
 * - verifyAuth
 *
 * @remark Verification of course ownership is done by the query for getting
 * the course
 */
export async function updateCoverImageController(
  req: Request<z.UpdateCoverImage["params"]>,
  res: Response
) {
  if (!req.files?.coverImage) {
    return res.status(400).json({ message: "No cover image provided" });
  }

  var course = await Course.findOne({
    _id: req.params.courseId,
    instructors: req.user._id,
  });
  if (!course) return res.status(404).json({ message: "Course not found" });

  var image = await updateCourseCoverImage(
    req.files.coverImage as UploadedFile,
    course
  );
  course.coverImage = image;
  await course.save();

  return res.status(200).json({ image });
}

// ==================================
// GROUP CONTROLLERS
// ==================================

/**
 * Create a new group in a course
 *
 * @route POST /api/course/:courseId/group
 *
 * @remark Middlewares used:
 * - verifyAuth
 */
export async function createGroupController(
  req: Request<z.CreateGroup["params"]>,
  res: Response
) {
  var user = req.user;
  var course = await Course.findOneAndUpdate(
    { _id: req.params.courseId, instructors: user._id },
    {
      $push: {
        groups: {
          lessons: [],
          lastEditedOn: new Date(Date.now()),
        },
      },
    },
    { new: true, fields: "-__v" }
  );

  if (!course) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var group = course.groups[course.groups.length - 1];
  return res.status(201).json({ group });
}

/**
 * Update a group in a course
 *
 * @route PUT /api/course/:courseId/group/:groupId
 *
 * @remark Fields that can be updated are:
 * - title
 * - description
 * - emoji
 * - lastEditedOn
 *
 * @remark Middlewares used:
 * - verifyAuth
 */
export async function updateGroupController(
  req: Request<z.UpdateGroup["params"], {}, z.UpdateGroup["body"]>,
  res: Response
) {
  var user = req.user;
  var course = await Course.findOneAndUpdate(
    {
      _id: req.params.courseId,
      "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
      instructors: user._id,
    },
    {
      $set: {
        "groups.$.emoji": req.body.emoji,
        "groups.$.title": req.body.title,
        "groups.$.description": req.body.description,
        "groups.$.lastEditedOn": new Date(Date.now()),
      },
    },
    { new: true, fields: "-__v" }
  );

  if (!course) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var group = course.groups.find((group) => group._id == req.params.groupId);
  return res.status(200).json({ group });
}

/**
 * Reorder lessons in a group
 *
 * @route PUT /api/course/:courseId/group/:groupId/reorder
 *
 * @remark Lessons are directly updated without checking if they are
 * part of the group OR not. Also it is not checked if the original lessons
 * are part of the group or not. This is done to reduce the number of requests
 *
 * @remark Middlewares used:
 * - verifyAuth
 */
export async function reorderLessonsController(
  req: Request<z.ReorderLessons["params"], {}, z.ReorderLessons["body"]>,
  res: Response
) {
  var user = req.user;
  var course = await Course.findOneAndUpdate(
    {
      _id: req.params.courseId,
      "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
      instructors: user._id,
    },
    { $set: { "groups.$.lessons": req.body.lessons } },
    { new: true, fields: "-__v" }
  );

  if (!course) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var group = course.groups.find((group) => group._id == req.params.groupId);
  return res.status(200).json({ group });
}

// ==================================
// LESSON CONTROLLERS
// ==================================

/**
 * Create a new lesson
 *
 * @route POST /api/course/:courseId/group/:groupId/lesson
 *
 * @remark Middlewares used:
 * - verifyAuth
 */
export async function createLessonController(
  req: Request<z.CreateLesson["params"]>,
  res: Response
) {
  var user = req.user;
  var course = await Course.findOne({
    _id: req.params.courseId,
    instructors: user._id,
  });

  if (!course) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var lesson = new Lesson();
  course.groups.map((g) => {
    if (g._id == req.params.groupId) {
      g.lessons.push(lesson);
    }
  });

  var session = await startSession();
  session.startTransaction();

  try {
    await lesson.save({ session });
    await course.save({ session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();
  return res.status(201).json({ lesson });
}

/**
 * Update a lesson settings
 *
 * @route PUT /api/course/:courseId/group/:groupId/lesson/:lessonId/settings
 *
 * @remark Middlewares used:
 * - verifyAuth
 */
export async function updateLessonSettingsController(
  req: Request<
    z.UpdateLessonSettings["params"],
    {},
    z.UpdateLessonSettings["body"]
  >,
  res: Response
) {
  var user = req.user;
  var course = await Course.findOne({
    _id: req.params.courseId,
    instructors: user._id,
  });

  if (!course) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var lesson = await Lesson.findOneAndUpdate(
    { _id: req.params.lessonId },
    {
      $set: {
        emoji: req.body.emoji,
        title: req.body.title,
        lastEditedOn: new Date(Date.now()),
      },
    },
    { new: true, fields: "-__v" }
  );

  if (!lesson) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.status(200).json({ message: "Lesson updated successfully" });
}