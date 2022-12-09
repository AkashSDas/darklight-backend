import cloudinary from "cloudinary";
import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import mongoose, { startSession } from "mongoose";

import { DocumentType } from "@typegoose/typegoose";

import { Course, Lesson } from "../models";
import { LessonClass } from "../models/lesson.model";
import * as z from "../schema/course.schema";
import { LESSON_VIDEO_DIR } from "../utils/cloudinary.util";
import { deleteContentBlock } from "../utils/course.util";

// ==================================
// LESSON CONTROLLERS
// ==================================

export async function getLessonController(req: Request, res: Response) {
  var lesson = await Lesson.findOne({
    _id: req.params.lessonId,
    course: req.params.courseId,
    group: req.params.groupId,
    instructors: req.user._id,
  });

  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  return res.status(200).json({ lesson });
}

/**
 * Create a new lesson and add it's `_id` to the group
 * @route POST /api/course/:courseId/group/:groupId/lesson
 *
 * @remark Saving the lesson in the course's respective group
 * this way works. Directly updating the group like using the
 * .map method OR course.groups[idx].lessons.push(lesson._id)
 * DOES NOT WORK
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function createLessonController(
  req: Request<z.CreateLesson["params"]>,
  res: Response
) {
  // Check if the course with the instructor along with the group exists OR not
  var course = await Course.findOne({
    _id: req.params.courseId,
    instructors: req.user._id,
    "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
  });

  if (!course) return res.status(404).json({ message: "Course not found" });

  // Create a lesson and add it to the respective group
  var lesson = new Lesson({
    instructors: [req.user._id],
    group: new mongoose.Types.ObjectId(req.params.groupId),
    course: course._id,
  });
  var groupdIdx = course.groups.findIndex((g) => g._id == req.params.groupId);
  var group = course.groups[groupdIdx];
  group.lessons.push(lesson._id);
  group.lastEditedOn = new Date(Date.now());
  course.groups[groupdIdx] = group;
  course.lastEditedOn = new Date(Date.now());

  var session = await startSession();
  session.startTransaction();

  try {
    lesson = await lesson.save({ session });
    course = await course.save({ session });
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();
  return res.status(201).json(lesson);
}

/**
 * Update lesson settings
 * @route PUT /api/course/:courseId/group/:groupId/lesson/:lessonId/settings
 * @remark Mongoose omits fields that are not defined in the schema, so it's ok to pass req.body directly
 * @remark Fields that can be updated are:
 * - title
 * - emoji
 * - free
 *
 * @remark With the query for the course it is checked whether the lesson is part
 * of the group which whether the part of the course of which the user is the owner
 *
 * @remark `$and` of query does not work in checking whether the course belongs to that
 * group OR not. So therefore two queries are used for getting the lesson
 *
 * Middlewares used:
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
  var lesson = await Lesson.findOneAndUpdate(
    {
      _id: req.params.lessonId,
      group: new mongoose.Types.ObjectId(req.params.groupId),
      course: new mongoose.Types.ObjectId(req.params.courseId),
      instructors: req.user._id,
    },
    {
      $set: {
        emoji: req.body.emoji,
        title: req.body.title,
        free: req.body.free,
        lastEditedOn: new Date(Date.now()),
      },
    },
    { new: true }
  );

  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  return res.status(200).json(lesson);
}

/**
 * Upload a video for a lesson
 * @route POST /api/course/:courseId/group/:groupId/lesson/:lessonId/video
 * @remark Cloudinary takes care of file type being video or not
 * @remark File name is `lessonVideo`
 *
 * @remark The code will update all the items in the groups array:
 * ```javascript
 * var result = await Course.findOneAndUpdate(
 *   {
 *     _id: new mongoose.Types.ObjectId(req.params.courseId),
 *     instructors: req.user._id,
 *     "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
 *   },
 *   {
 *     $set: {
 *       "groups.$[].lastEditedOn": new Date(Date.now()),
 *       "groups.$[].videoDuration": 0,
 *       "groups.$[].contentDuration": 0,
 *     },
 *   },
 *   {
 *     new: true,
 *     session,
 *   }
 * );
 * ```
 *
 * @remark The code will update only group item which matches the group id
 * ```javascript
 * var result = await Course.findOneAndUpdate(
 *   {
 *     _id: new mongoose.Types.ObjectId(req.params.courseId),
 *     instructors: req.user._id,
 *     "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
 *   },
 *   {
 *     $set: {
 *       "groups.$[g].lastEditedOn": new Date(Date.now()),
 *       "groups.$[g].videoDuration": 0,
 *       "groups.$[g].contentDuration": 0,
 *     },
 *     $inc: { "groups.$[g].videoDuration": 10 },
 *   },
 *   {
 *     new: true,
 *     arrayFilters: [
 *       { "g._id": new mongoose.Types.ObjectId(req.params.groupId) },
 *     ],
 *     session,
 *   }
 * );
 * ```
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function updateLessonVideoController(
  req: Request<z.UpdateLessonVideo["params"]>,
  res: Response
) {
  var file = req.files?.lessonVideo as UploadedFile;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  var lesson = await Lesson.findOne({
    _id: req.params.lessonId,
    group: new mongoose.Types.ObjectId(req.params.groupId),
    course: new mongoose.Types.ObjectId(req.params.courseId),
    instructors: req.user._id,
  });
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  // Delete old video if it exists
  if (lesson.video?.id) {
    await cloudinary.v2.uploader.destroy(lesson.video.id, {
      resource_type: "video",
    });
  }

  // Upload new video
  var video = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: `${LESSON_VIDEO_DIR}/${lesson.course}`,
    resource_type: "video",
    filename_override: lesson._id.toString(),
    image_metadata: true,
  });
  var videoDuration = lesson.videoDuration;
  lesson.video = { id: video.public_id, URL: video.secure_url };
  lesson.videoDuration = video.duration;
  lesson.lastEditedOn = new Date(Date.now());

  var session = await startSession();
  session.startTransaction();

  try {
    lesson = await lesson.save({ session });

    var course = await Course.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
        "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
      },
      {
        $set: {
          "groups.$[g].lastEditedOn": new Date(Date.now()),
        },
        $inc: {
          "groups.$[g].videoDuration": Math.abs(videoDuration - 0),
        },
      },
      {
        new: true,
        arrayFilters: [
          { "g._id": new mongoose.Types.ObjectId(req.params.groupId) },
        ],
        session,
      }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();
  return res.status(200).json({ videoURL: video.secure_url, lesson, course });
}

/**
 * Remove lesson video
 * @route DELETE /api/course/:courseId/group/:groupId/lesson/:lessonId/video
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function removeLessonVideoController(
  req: Request<z.UpdateLessonVideo["params"]>,
  res: Response
) {
  var lesson = await Lesson.findOne({
    _id: req.params.lessonId,
    group: new mongoose.Types.ObjectId(req.params.groupId),
    course: new mongoose.Types.ObjectId(req.params.courseId),
    instructors: req.user._id,
  });
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  // Delete old video if it exists
  if (lesson.video?.id) {
    await cloudinary.v2.uploader.destroy(lesson.video.id, {
      resource_type: "video",
    });
  } else {
    return res.status(400).json({ message: "No video to delete" });
  }

  var videoDuration = lesson.videoDuration;
  lesson.video = undefined;
  lesson.videoDuration = 0;
  lesson.lastEditedOn = new Date(Date.now());

  var session = await startSession();
  session.startTransaction();

  try {
    lesson = await lesson.save({ session });

    var course = await Course.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
        "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
      },
      {
        $set: {
          "groups.$[g].lastEditedOn": new Date(Date.now()),
        },
        $inc: { "groups.$[g].videoDuration": -videoDuration },
      },
      {
        new: true,
        arrayFilters: [
          { "g._id": new mongoose.Types.ObjectId(req.params.groupId) },
        ],
        session,
      }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();
  return res.status(200).json({ lesson, course });
}

/**
 * Move lesson from one group to another group in the same course
 * @route PUT /api/course/:courseId/group/:groupId/lesson/:lessonId/move
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function moveLessonToAnotherGroupController(
  req: Request<
    z.MoveLessonToAnotherGroup["params"],
    {},
    z.MoveLessonToAnotherGroup["body"]
  >,
  res: Response
) {
  var course = await Course.findOne({
    _id: new mongoose.Types.ObjectId(req.params.courseId),
    instructors: req.user._id,
    "groups._id": {
      $all: [
        new mongoose.Types.ObjectId(req.params.groupId),
        new mongoose.Types.ObjectId(req.body.newGroupId),
      ],
    },
    "groups.lessons": new mongoose.Types.ObjectId(req.params.lessonId),
  });

  if (!course) return res.status(404).json({ message: "Course not found" });

  {
    let addToGroup = course.groups.findIndex(
      (g) => g._id == req.body.newGroupId
    );
    let removeFromGroup = course.groups.findIndex(
      (g) => g._id == req.params.groupId
    );

    let toGroupLessons = course.groups[addToGroup].lessons;
    let fromGroupLessons = course.groups[removeFromGroup].lessons;

    let lessonIndex = fromGroupLessons.findIndex(
      (l) => l._id.toString() == req.params.lessonId
    );

    toGroupLessons.push(fromGroupLessons[lessonIndex]);
    fromGroupLessons.splice(lessonIndex, 1);

    course.groups[addToGroup].lessons = toGroupLessons;
    course.groups[removeFromGroup].lessons = fromGroupLessons;
  }

  var session = await startSession();
  session.startTransaction();

  try {
    let lessonQuery = Lesson.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.lessonId),
        group: new mongoose.Types.ObjectId(req.params.groupId),
        course: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
      },
      {
        $set: {
          group: new mongoose.Types.ObjectId(req.body.newGroupId),
          lastEditedOn: new Date(Date.now()),
        },
      },
      { session, new: true }
    );
    course.lastEditedOn = new Date(Date.now());

    var lesson: DocumentType<LessonClass>;
    [lesson, course] = await Promise.all([
      lessonQuery,
      course.save({ session }),
    ]);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();

  return res.status(200).json({ lesson, course });
}

/**
 * Delete lesson from a group
 * @route DELETE /api/course/:courseId/group/:groupId/lesson/:lessonId
 * @remark This deletes lesson doc, video, content, attachments
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function deleteLessonController(req: Request, res: Response) {
  var lesson = await Lesson.findOne({
    _id: req.params.lessonId,
    group: new mongoose.Types.ObjectId(req.params.groupId),
    course: new mongoose.Types.ObjectId(req.params.courseId),
    instructors: req.user._id,
  });
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  var promises = [];

  // Delete video if it exists
  if (lesson.video?.id) {
    promises.push(
      cloudinary.v2.uploader.destroy(lesson.video.id, {
        resource_type: "video",
      })
    );
  }

  // Delete contents
  for (let i = 0; i < lesson.content.length; i++) {
    let content = lesson.content[i];
    promises.push(
      deleteContentBlock({
        id: content.id,
        type: content.type,
        data: content.data,
      })
    );
  }

  // Delete attachments
  for (let i = 0; i < lesson.attachments.length; i++) {
    let attachment = lesson.attachments[i];
    promises.push(
      cloudinary.v2.uploader.destroy(attachment.id, {
        resource_type: "raw",
      })
    );
  }

  await Promise.all(promises);

  var session = await startSession();
  session.startTransaction();

  try {
    let lessonQuery = lesson.deleteOne({ session });
    let courseQuery = Course.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
        "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
      },
      {
        $set: {
          "groups.$[g].lastEditedOn": new Date(Date.now()),
          lastEditedOn: new Date(Date.now()),
        },
        $inc: { "groups.$[g].videoDuration": -lesson.videoDuration },
        $pull: {
          "groups.$[g].lessons": new mongoose.Types.ObjectId(
            req.params.lessonId
          ),
        },
      },
      {
        new: true,
        arrayFilters: [
          { "g._id": new mongoose.Types.ObjectId(req.params.groupId) },
        ],
        session,
      }
    );

    var [_, course] = await Promise.all([lessonQuery, courseQuery]);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();

  return res.status(200).json({ lesson, course });
}
