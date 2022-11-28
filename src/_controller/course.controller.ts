import cloudinary from "cloudinary";
import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import mongoose, { startSession } from "mongoose";

import { Course, Lesson } from "../_models";
import * as z from "../_schema/course.schema";
import { LESSON_VIDEO_DIR } from "../_utils/cloudinary.util";
import { CourseStage, generateContentBlock, removeLessonVideo, updateContentBlock, updateCourseCoverImage } from "../_utils/course.util";
import { UserRole } from "../_utils/user.util";

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

// ==================================
// LESSON CONTROLLERS
// ==================================

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
          "groups.$[].lastEditedOn": new Date(Date.now()),
        },
        $inc: { "groups.$[].videoDuration": video.duration },
      },
      { new: true, session }
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
 *
 * @route DELETE /api/course/:courseId/group/:groupId/lesson/:lessonId/video
 *
 * @remark Middlewares used:
 * - verifyAuth
 */
export async function removeLessonVideoController(
  req: Request<z.UpdateLessonVideo["params"]>,
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

  var lesson = await Lesson.findOne({ _id: req.params.lessonId });
  if (!lesson) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await removeLessonVideo(lesson);

  // Updating video duration in the course
  let idx = course.groups.findIndex((g) => {
    if (g._id == req.params.groupId) return true;
    return false;
  });
  let group = course.groups[idx];
  group.videoDuration = group.videoDuration - lesson.videoDuration;
  course.groups[idx] = group;

  lesson.video = undefined;
  lesson.videoDuration = 0;
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
  return res.status(200).json({ message: "Video removed successfully" });
}

// function addLessonAttachmentController() {}

// function removeLessonAttachmentController() {}

// ==================================
// CONTENT CONTROLLERS
// ==================================

/**
 * Add content to a lesson
 *
 * @route POST /api/course/:courseId/group/:groupId/lesson/:lessonId/content
 *
 * @remark Middlewares used:
 * - verifyAuth
 */
export async function createContentController(
  req: Request<z.CreateContent["params"]>,
  res: Response
) {
  var user = req.user;
  var [course, lesson] = await Promise.all([
    Course.findOne({ _id: req.params.courseId, instructors: user._id }),
    Lesson.findOne({ _id: req.params.lessonId }),
  ]);

  if (!course || !lesson) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var content = generateContentBlock(req.body.type);
  if (!content) {
    return res.status(400).json({ message: "Invalid content type" });
  }
  lesson.content.push(content);
  lesson.save();

  return res.status(201).json({ content });
}

export async function updateContentController(
  // req: Request<z.UpdateContent["params"], {}, z.UpdateContent["body"]>,
  req: Request<z.UpdateContent["params"]>,
  res: Response
) {
  var user = req.user;

  var [course, lesson] = await Promise.all([
    Course.findOne({ _id: req.params.courseId, instructors: user._id }),
    Lesson.findOne({ _id: req.params.lessonId }),
  ]);

  if (!course || !lesson) {
    return res.status(403).json({ message: "Forbidden" });
  }

  var idx = lesson.content.findIndex((c) => c.id == req.params.contentId);
  var content = lesson.content[idx];
  if (!content) {
    return res.status(404).json({ message: "Content not found" });
  }

  var updatedcontent = await updateContentBlock(
    course._id.toString(),
    lesson._id.toString(),
    content,
    req.body as any,
    req.files
  );

  var contentBlocks = lesson.content;
  contentBlocks[idx] = updatedcontent;
  lesson.content = contentBlocks;
  await lesson.save();

  return res.status(200).json({ content: updatedcontent });
}

// function removeContentController() {}

// function reorderContentController() {}
