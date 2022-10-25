import { FilterQuery } from "mongoose";

import { CourseModel, TCourseClass } from "../models/course.model";

export async function createCourseService(course: Partial<TCourseClass>) {
  return await CourseModel.create(course);
}

export async function getCourseService(filter: FilterQuery<TCourseClass>) {
  return await CourseModel.findOne(filter, "-__v")
    .populate({
      path: "modules",
      populate: {
        path: "lessons",
        model: "course-lesson",
        select: "-contents -qna -attachments",
      },
    })
    .exec();
}

export async function updateCourseService(
  filter: FilterQuery<TCourseClass>,
  update: Partial<TCourseClass>
) {
  return await CourseModel.findOneAndUpdate(filter, update, {
    new: true,
    fields: "-_id -__v",
  }).exec();
}

export async function deleteCourseService(filter: FilterQuery<TCourseClass>) {
  return await CourseModel.findOneAndDelete(filter).exec();
}
