import cloudinary from "cloudinary";
import { Request, Response } from "express";
import mongoose, { startSession } from "mongoose";

import { Course, Lesson } from "../models";
import * as z from "../schema/course.schema";
import { deleteContentBlock } from "../utils/course.util";

// ==================================
// GROUP CONTROLLERS
// ==================================

/**
 * Add a new group in a course
 * @route POST /api/course/:courseId/group
 *
 * Middelewares used:
 * - verifyAuth
 */
export async function addGroupController(
  req: Request<z.AddGroup["params"]>,
  res: Response
) {
  var course = await Course.findOneAndUpdate(
    { _id: req.params.courseId, instructors: req.user._id },
    {
      $push: {
        groups: {
          _id: new mongoose.Types.ObjectId(),
          lessons: [],
          lastEditedOn: new Date(Date.now()),
          videoDuration: 0,
          contentDuration: 0,
        },
      },
    },
    { new: true }
  );

  if (!course) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var group = course.groups[course.groups.length - 1];
  return res.status(201).json({ group });
}

/**
 * Update a group in a course
 * @route PUT /api/course/:courseId/group/:groupId
 * @remark all the fields that this route updates are required even if they are not updated
 * @remark Mongoose omits fields that are not defined in the schema, so it's ok to pass req.body directly
 * @remark Fields that can be updated are:
 * - title
 * - description
 * - emoji
 * - lastEditedOn
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function updateGroupController(
  req: Request<z.UpdateGroup["params"], {}, z.UpdateGroup["body"]>,
  res: Response
) {
  var course = await Course.findOneAndUpdate(
    {
      _id: req.params.courseId,
      instructors: req.user._id,
      "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
    },
    {
      $set: {
        "groups.$[g].emoji": req.body.emoji,
        "groups.$[g].title": req.body.title,
        "groups.$[g].description": req.body.description,
        "groups.$[g].lastEditedOn": new Date(Date.now()),
      },
    },
    {
      new: true,
      arrayFilters: [
        { "g._id": new mongoose.Types.ObjectId(req.params.groupId) },
      ],
    }
  );

  if (!course) return res.status(404).json({ message: "Course not found" });
  var group = course.groups.find(
    (group) => group._id.toString() == req.params.groupId
  );
  return res.status(200).json(group);
}

/**
 * Reorder lessons in a group
 * @route PUT /api/course/:courseId/group/:groupId/reorder
 * @remark Lessons are directly updated without checking if they are
 * part of the group OR not. Also it is not checked if the original lessons
 * are part of the group or not. This is done to reduce the number of requests
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function reorderLessonsController(
  req: Request<z.ReorderLessons["params"], {}, z.ReorderLessons["body"]>,
  res: Response
) {
  var course = await Course.findOneAndUpdate(
    {
      _id: req.params.courseId,
      instructors: req.user._id,
      "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
    },
    {
      $set: {
        "groups.$.lessons": req.body.lessons,
        "groups.$.lastEditedOn": new Date(Date.now()),
      },
    },
    { new: true }
  );

  if (!course) return res.status(403).json({ message: "Forbidden" });
  var group = course.groups.find(
    (group) => group._id.toString() == req.params.groupId
  );
  return res.status(200).json(group);
}

export async function deleteGroupController(req: Request, res: Response) {
  var course = await Course.findOne({
    _id: req.params.courseId,
    instructors: req.user._id,
  });
  if (!course) return res.status(404).json({ message: "Course not found" });
  var group = course.groups.find(
    (group) => group._id.toString() == req.params.groupId
  );
  if (!group) return res.status(404).json({ message: "Group not found" });

  // Remove group from course
  var index = course.groups.indexOf(group);
  course.groups.splice(index, 1);
  course.lastEditedOn = new Date(Date.now());

  // Delete all lessons in the group
  {
    let lessonIds = group.lessons.map((lesson) => lesson._id);
    var lessons = await Lesson.find({ _id: { $in: lessonIds } });
    let promises = [];
    for (let i = 0; i < lessons.length; i++) {
      let lesson = lessons[i];

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
    }

    await Promise.all(promises);
  }

  var session = await startSession();
  session.startTransaction();

  try {
    let lessonQuery = Lesson.deleteMany({ _id: { $in: lessons } });
    await Promise.all([lessonQuery, course.save({ session })]);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();

  return res.status(200).json({ message: "Group deleted" });
}
