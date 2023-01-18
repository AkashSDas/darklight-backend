import { Request, Response } from "express";
import { startSession, Types } from "mongoose";

import { Course } from "../models";
import { EnrolledCourse } from "../models/enrolled-course.model";

/**
 * Buy a course
 * @route POST /api/enrolled/buy/:courseId
 *
 * Middlewares used
 * - verify auth
 */
export async function buyCourseController(req: Request, res: Response) {
  // Check if the course exists OR not
  var course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).send("Course not found");

  // Check if the user has already enrolled in the course
  {
    let enrolledCourse = await EnrolledCourse.findOne({
      course: course._id,
      user: req.user._id,
    });
    if (enrolledCourse) return res.status(400).send("Already enrolled");
  }

  var amountToCharge = Math.min(Math.max(course.price, 50), 99999999);

  // Create a new enrolled course
  var enrolledCourse = new EnrolledCourse({
    course: course._id,
    user: req.user._id,
    pricePayed: amountToCharge, // course current price
  });

  // Increment the number of enrolled students
  course.enrolled += 1;

  // Add course enrolled to user
  req.user.enrolledCourses.push(enrolledCourse._id);

  var session = await startSession();
  session.startTransaction();

  try {
    await Promise.all([
      course.save({ session }),
      enrolledCourse.save({ session }),
      req.user.save({ session }),
    ]);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();

  return res.status(200).json({
    message: "Course enrolled successfully",
    enrolledCourse,
  });
}

/**
 * Get all enrolled course
 * @route GET /api/enrolled/:courseId
 *
 * Middlewares used
 * - verify auth
 */
export async function getEnrolledCourseController(req: Request, res: Response) {
  var enrolledCourse = await EnrolledCourse.findOne({
    course: req.params.courseId,
    user: req.user._id,
  }).populate([
    {
      path: "course",
      model: "course",
      populate: { path: "groups.lessons", model: "lesson" },
    },
  ]);

  if (!enrolledCourse) return res.status(404).send("Course not found");
  return res.status(200).json({ course: enrolledCourse });
}

/**
 * Get all enrolled courses
 * @route GET /api/enrolled
 *
 * Middlewares used
 * - verify auth
 */
export async function getEnrolledCoursesController(
  req: Request,
  res: Response
) {
  const LIMIT = 1;
  var next = req.query.next as string;

  var result = await (EnrolledCourse as any).paginateEnrolledCourse({
    query: { user: req.user._id },
    limit: LIMIT,
    paginatedField: "updatedAt",
    next,
  });

  var populatedEnrolledCourses = await EnrolledCourse.populate(result.results, [
    {
      path: "course",
      model: "course",
      populate: { path: "groups.lessons", model: "lesson" },
    },
  ]);

  return res.status(200).json({
    courses: populatedEnrolledCourses,
    hasPrevious: result.hasPrevious,
    hasNext: result.hasNext,
    next: result.next,
  });
}

/**
 * Toggle lesson done status
 * @route PUT /api/enrolled/done/:courseId/lesson/:lessonId
 */
export async function toggleLessonCompletionController(
  req: Request,
  res: Response
) {
  var course = await EnrolledCourse.findOne({
    course: req.params.courseId,
    uesr: req.user._id,
  });

  if (!course) {
    return res.status(404).json({ message: "You're not enrolled in" });
  }

  if (
    course.doneLessons.includes(
      new Types.ObjectId(req.params.lessonId as string)
    )
  ) {
    // Remove it
    let modifiedDoneLessons = course.doneLessons.filter(
      (id) => id != (req.params.lessonId as any)
    );

    course.doneLessons = modifiedDoneLessons;
  } else {
    // Add it
    course.doneLessons.push(new Types.ObjectId(req.params.lessonId as string));
  }

  await course.save();
  return res.status(200).json({ message: "Done" });
}
