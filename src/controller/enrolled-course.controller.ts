import { Request, Response } from "express";
import { startSession } from "mongoose";
import { Course } from "../models";
import { EnrolledCourse } from "../models/enrolled-course.model";

export async function buyCourseController(req: Request, res: Response) {
    var course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).send("Course not found");
    course.enrolled += 1


    var enrolledCourse = new EnrolledCourse()
    enrolledCourse.course = course._id
    enrolledCourse.user = req.user._id
    enrolledCourse.price = course.price
    let lessons = []
    for (let grpLessons of course.groups.map(g => g.lessons)) {
        lessons.concat(grpLessons.map(l => ({ lesson: l, done: false })))
    }
    enrolledCourse.progress = lessons


    var session = await startSession();
    session.startTransaction();

    try {
        await Promise.all([enrolledCourse.save({ session }), course.save({ session })]);
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    }

    session.endSession();
    return res.status(200).send(enrolledCourse);
} 