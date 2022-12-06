import cloudinary from "cloudinary";
import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import { startSession } from "mongoose";

import { Course, Lesson } from "../models";
import * as z from "../schema/course.schema";
import { CourseStage, deleteContentBlock, updateCourseCoverImage } from "../utils/course.util";
import { UserRole } from "../utils/user.util";

// ==================================
// COURSE CONTROLLERS
// ==================================

/**
 * Create a new course with the requesting user as an instructor
 * @route POST /api/course
 * @remark Whether user has instuctor's role is checked here
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function createCourseController(req: Request, res: Response) {
  var user = req.user;
  if (!user.roles.includes(UserRole.TEACHER)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var course = new Course();
  course.instructors.push(user._id);
  course = await course.save();
  return res.status(201).json(course);
}

/**
 * Update course settings
 * @route PUT /api/course/:courseId/settings
 * @remark Verification of course ownership is done by the query for getting the course
 * @remark Mongoose omits fields that are not defined in the schema, so it's ok to pass req.body directly
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
 * Middlewares used:
 * - verifyAuth
 */
export async function updateCourseSettingsController(
  req: Request<z.CourseSettings["params"], {}, z.CourseSettings["body"]>,
  res: Response
) {
  // This check whether the course exists and whether the user is an instructor
  var course = await Course.findOneAndUpdate(
    { _id: req.params.courseId, instructors: req.user._id },
    { $set: { ...req.body } },
    { new: true, fields: "-__v" }
  );

  if (!course) return res.status(404).json({ message: "Course not found" });
  return res.status(200).json(course);
}

/**
 * Update course cover image
 * @route PUT /api/course/:courseId/cover
 * @remark Cover image file name is `coverImage`
 * @remark Verification of course ownership is done by the query for getting the course
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function updateCourseCoverController(
  req: Request<z.UpdateCourseCover["params"]>,
  res: Response
) {
  if (!req.files?.coverImage) {
    return res.status(400).json({ message: "No cover image provided" });
  }

  // Get course if it exists and user is its instructor
  var course = await Course.findOne({
    _id: req.params.courseId,
    instructors: req.user._id,
  });
  if (!course) return res.status(404).json({ message: "Course not found" });

  // Update course cover image
  var coverImage = req.files.coverImage as UploadedFile;
  var image = await updateCourseCoverImage(coverImage, course);
  course.coverImage = image;
  await course.save();
  return res.status(200).json(image);
}

/**
 * Get course by id
 * @route GET /api/course/:courseId
 * @remark Here "instructors" and "groups.lessons" are populated
 */
export async function getCourseController(
  req: Request<z.GetCourse["params"]>,
  res: Response
) {
  var course = await Course.findById(req.params.courseId).populate([
    {
      path: "instructors",
      model: "-user",
      select:
        "-__v -oauthProviders -createdAt -updatedAt -verified -active -roles +profileImage",
    },
    {
      path: "groups.lessons",
      model: "-lesson",
      select: "-__v -content -video -qna -attachements",
    },
  ]);

  if (!course) return res.status(404).json({ message: "Course not found" });
  return res.status(200).json(course);
}

/**
 * Get published courses
 * @route GET /api/course
 */
export async function getCoursesController(req: Request, res: Response) {
  const LIMIT = 2;
  var next = req.query.next as string;
  var result = await (Course as any).paginateCourse({
    query: { stage: CourseStage.PUBLISHED },
    limit: LIMIT,
    paginatedField: "updatedAt",
    next,
  });

  var populatedCourses = await Course.populate(result.results, [
    {
      path: "instructors",
      model: "-user",
      select:
        "-__v -oauthProviders -createdAt -updatedAt -verified -active -roles +profileImage",
    },
    {
      path: "groups.lessons",
      model: "-lesson",
      select: "-__v -content -video -qna -attachements",
    },
  ]);

  return res.status(200).json({
    courses: populatedCourses,
    hasPrevious: result.hasPrevious,
    hasNext: result.hasNext,
    next: result.next,
  });
}

export async function deleteCourseController(req: Request, res: Response) {
  var course = await Course.findOne({
    _id: req.params.courseId,
    instructors: req.user._id,
  });
  if (!course) return res.status(404).json({ message: "Course not found" });
  var lessons = await Lesson.find({ course: course._id });

  // Delete all lessons's assets
  {
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
    let courseQuery = Course.deleteOne({ _id: course._id });
    await Promise.all([lessonQuery, courseQuery]);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();
  return res.status(200).json(course);
}

/**
 * Get editable course by id
 * @route GET /api/course/:courseId/editable
 * @remark Here "instructors" and "groups.lessons" are populated
 *
 * Middlewares used:
 * - verifyAuth
 */
export async function getEditableCourseController(
  req: Request<z.GetCourse["params"]>,
  res: Response
) {
  var course = await Course.findOne({
    _id: req.params.courseId,
    instructors: req.user._id,
  }).populate([
    { path: "instructors", model: "user" },
    {
      path: "groups.lessons",
      model: "lesson",
      select: "-__v -content -video -qna -attachements",
    },
  ]);

  if (!course) return res.status(404).json({ message: "Course not found" });
  return res.status(200).json(course);
}
