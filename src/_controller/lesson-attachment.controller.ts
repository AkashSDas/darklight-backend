

import cloudinary from "cloudinary";
import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import mongoose from "mongoose";

import { Course, Lesson } from "../_models";
import * as z from "../_schema/course.schema";
import { LESSON_ATTACHMENT } from "../_utils/cloudinary.util";

// ==================================
// ATTACHEMENT CONTROLLERS
// ==================================

/**
 * Add an attachment to a lesson
 * @route POST /api/course/:courseId/group/:groupId/lesson/:lessonId/attachment
 * @remark attachment files will in `req.files.attachment`
 * @remark This will upload only one attachemnt at a time
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function addAttachmentController(req: Request, res: Response) {
    var file = req.files?.attachment as UploadedFile;
    if (!file) {
        return res.status(400).json({ message: "Attachment not provided" });
    }

    var lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        group: new mongoose.Types.ObjectId(req.params.groupId),
        course: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
    });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    var attachment = await cloudinary.v2.uploader.upload(file.tempFilePath, {
        folder: `${LESSON_ATTACHMENT}/${lesson.course}`,
        resource_type: "raw",
        image_metadata: true,
    });

    lesson.attachments.push({
        id: attachment.public_id,
        URL: attachment.secure_url,
        name: file.name,
        fileType: attachment.resource_type as any,
        description: req.body.description
    });

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
    return res.status(200).json({ attachment: lesson.attachments[lesson.attachments.length - 1] });
}

/**
 * Remove an attachment from a lesson
 * @route DELETE /api/course/:courseId/group/:groupId/lesson/:lessonId/attachment
 * @remark body will contain `attachmentId`
 * 
 * Middlewares used:
 * - verifyAuth
 */
export async function removeAttachmentController(req: Request<z.RemoveAttachment['params']>, res: Response) {
    var lesson = await Lesson.findOne({
        _id: req.params.lessonId,
        group: new mongoose.Types.ObjectId(req.params.groupId),
        course: new mongoose.Types.ObjectId(req.params.courseId),
        instructors: req.user._id,
    });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    var attachment = lesson.attachments.find((a) => a.id == req.body.attachmentId);
    if (!attachment) return res.status(404).json({ message: "Attachment not found" });

    {
        // Remove attachment
        let attachments = lesson.attachments
        let idx = attachments.findIndex((a) => a.id == req.body.attachmentId);
        attachments.splice(idx, 1);
        await cloudinary.v2.uploader.destroy(attachment.id, {
            resource_type: "raw",
        });
    }

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
    return res.status(200).json({ message: "Attachment removed" });
}