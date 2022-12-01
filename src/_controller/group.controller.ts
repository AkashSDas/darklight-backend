
import { Request, Response } from "express";
import mongoose from "mongoose";

import { Course } from "../_models";
import * as z from "../_schema/course.schema";

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
                "groups.$.emoji": req.body.emoji,
                "groups.$.title": req.body.title,
                "groups.$.description": req.body.description,
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

