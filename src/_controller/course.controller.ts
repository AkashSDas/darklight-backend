import cloudinary from "cloudinary";
import { Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import mongoose, { startSession } from "mongoose";

import { DocumentType } from "@typegoose/typegoose";

import { Course, Lesson } from "../_models";
import { LessonClass } from "../_models/lesson.model";
import * as z from "../_schema/course.schema";
import { LESSON_VIDEO_DIR } from "../_utils/cloudinary.util";
import { CourseStage, deleteContentBlock, generateContentBlock, updateContentBlock, updateCourseCoverImage } from "../_utils/course.util";
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
// videoURL: video.secure_url
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
