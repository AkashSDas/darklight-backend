import { Request, Response } from "express";
import { startSession } from "mongoose";

import { Course } from "../models";
import { EnrolledCourse } from "../models/enrolled-course.model";

// TODO: Add payment gateway
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

  // Create a new enrolled course
  var enrolledCourse = new EnrolledCourse({
    course: course._id,
    user: req.user._id,
    pricePayed: course.price, // course current price
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
  }).populate([{ path: "course", model: "course" }]);

  if (!enrolledCourse) return res.status(404).send("Course not found");
  return res.status(200).json({ course: enrolledCourse });
}
