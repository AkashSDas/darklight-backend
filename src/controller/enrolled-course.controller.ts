import { Request, Response } from "express";
import { startSession } from "mongoose";

import { Course } from "../models";
import { EnrolledCourse } from "../models/enrolled-course.model";

// TODO: Add payment gateway
/**
 * Buy a course
 * @route POST /api/enrolled-course/buy/:courseId
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

  var session = await startSession();
  session.startTransaction();

  try {
    await Promise.all([
      course.save({ session }),
      enrolledCourse.save({ session }),
    ]);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }

  session.endSession();
  return res.status(200).send("Enrolled");
}