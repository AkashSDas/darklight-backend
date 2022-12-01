

import { Request, Response } from "express";
import mongoose from "mongoose";

import { Course, Lesson } from "../_models";
import * as z from "../_schema/course.schema";
import { deleteContentBlock, generateContentBlock, updateContentBlock } from "../_utils/course.util";

// ==================================
// CONTENT CONTROLLERS
// ==================================

/**
 * Add content to a lesson
 * @route POST /api/course/:courseId/group/:groupId/lesson/:lessonId/content
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function createContentController(
    req: Request<z.CreateContent["params"]>,
    res: Response
) {
    // Get the lesson if it exists
    var lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        group: new mongoose.Types.ObjectId(req.params.groupId),
        course: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
    });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Create content
    var content = generateContentBlock(req.body.type);
    if (!content) {
        return res.status(400).json({ message: "Invalid content type" });
    }

    // Save content in the lesson and update lesson and course lastEditedOn
    // Updating both of them concurrently. Also if the saving of lastEditedOn
    // for course fail's its OK, therefore not using sessions
    lesson.content.push(content);
    lesson.lastEditedOn = new Date(Date.now());
    var courseQuery = Course.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(req.params.courseId),
            instructors: req.user._id,
            "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
        },
        { $set: { lastEditedOn: new Date(Date.now()) } },
        { new: true }
    );

    var [lesson] = await Promise.all([lesson.save(), courseQuery]);
    return res.status(200).json({ content, lesson });
}

/**
 * Delete content of a lesson
 * @route DELETE /api/course/:courseId/group/:groupId/lesson/:lessonId/content/:contentId
 *
 * @remark Body will be of shape
 * - type of content
 * - data of content
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function deleteContentController(
    req: Request<z.UpdateContent["params"]>,
    res: Response
) {
    if (!req.body.type)
        return res.status(400).json({ message: "Content type not provided" });
    if (!req.body.data)
        return res.status(400).json({ message: "Content data not provided" });
    if (!req.body.id)
        return res.status(400).json({ message: "Content id not provided" });

    var lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        group: new mongoose.Types.ObjectId(req.params.groupId),
        course: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
    });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Check if the content types are same OR not
    var content = lesson.content.find((c) => c.id == req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });
    if (req.body.type != content.type) {
        return res.status(400).json({ message: "Content type mismatch" });
    }

    // Delete content
    await deleteContentBlock({
        id: content.id,
        type: content.type,
        data: JSON.parse(req.body.data),
    });
    var contentIndex = lesson.content.findIndex(
        (c) => c.id == req.params.contentId
    );
    lesson.content.splice(contentIndex, 1);

    // Save lesson and update course lastEditedOn
    lesson.lastEditedOn = new Date(Date.now());
    var courseQuery = Course.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(req.params.courseId),
            instructors: req.user._id,
            "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
        },
        { $set: { lastEditedOn: new Date(Date.now()) } },
        { new: true }
    );

    var [lesson] = await Promise.all([lesson.save(), courseQuery]);
    return res.status(200).json(lesson);
}

/**
 * Update content of a lesson
 * @route PUT /api/course/:courseId/group/:groupId/lesson/:lessonId/content/:contentId
 *
 * @remark Body will be of shape
 * - type of content
 * - data of content
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function updateContentController(
    req: Request<z.UpdateContent["params"]>,
    res: Response
) {
    if (!req.body.type)
        return res.status(400).json({ message: "Content type not provided" });
    if (!req.body.data)
        return res.status(400).json({ message: "Content data not provided" });
    if (!req.body.id)
        return res.status(400).json({ message: "Content id not provided" });

    var lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        group: new mongoose.Types.ObjectId(req.params.groupId),
        course: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
    });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Check if the content types are same OR not
    var content = lesson.content.find((c) => c.id == req.params.contentId);
    if (!content) return res.status(404).json({ message: "Content not found" });
    if (req.body.type != content.type) {
        return res.status(400).json({ message: "Content type mismatch" });
    }

    // Update content
    var bodyData = JSON.parse(req.body.data);
    var updateContent = await updateContentBlock(
        {
            id: content.id,
            type: content.type,
            data: bodyData,
        },
        req.files,
        lesson.course.toString(),
        lesson._id.toString()
    );

    // Update lesson and course lastEditedOn
    var idx = lesson.content.findIndex((c) => c.id == req.params.contentId);
    var contentToUpdate = lesson.content[idx];
    contentToUpdate.data = updateContent.data;
    lesson.lastEditedOn = new Date(Date.now());
    lesson.content[idx] = contentToUpdate;
    var courseQuery = Course.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(req.params.courseId),
            instructors: req.user._id,
            "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
        },
        { $set: { lastEditedOn: new Date(Date.now()) } },
        { new: true }
    );

    var [lesson] = await Promise.all([lesson.save(), courseQuery]);
    return res.status(200).json({ content: updateContent, lesson });
}

/**
 * Reorder content of a lesson
 * @route PUT /api/course/:courseId/group/:groupId/lesson/:lessonId/content/reorder
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function reorderContentController(
    req: Request<z.ReorderContent["params"], {}, z.ReorderContent["body"]>,
    res: Response
) {
    var lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        group: new mongoose.Types.ObjectId(req.params.groupId),
        course: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
    });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // Check if all the content in the lesson are included in the request
    {
        let oldOrderIds = lesson.content.map((c) => c.id);
        let newOrderIdsSet = new Set(req.body.order);
        for (let id of oldOrderIds) {
            if (!newOrderIdsSet.has(id)) {
                return res.status(400).json({ message: "Content order mismatch" });
            }
        }
    }

    // Update content order
    {
        let content = [];
        for (let i = 0; i < lesson.content.length; i++) {
            let block = lesson.content.find((c) => c.id == req.body.order[i]);
            content.push(block);
        }
        lesson.content = content;
    }

    lesson.lastEditedOn = new Date(Date.now());
    var courseQuery = Course.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(req.params.courseId),
            instructors: req.user._id,
            "groups._id": new mongoose.Types.ObjectId(req.params.groupId),
        },
        { $set: { lastEditedOn: new Date(Date.now()) } },
        { new: true }
    );

    var [lesson] = await Promise.all([lesson.save(), courseQuery]);
    return res.status(200).json(lesson);
}

