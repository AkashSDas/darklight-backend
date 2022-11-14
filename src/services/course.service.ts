import { FilterQuery } from "mongoose";

import { CourseLessonModel } from "../models/course-lesson.model";
import { CourseLifecycleStage, CourseModel, TCourseClass } from "../models/course.model";
import { UserModel } from "../models/user.model";

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

export async function getAllCoursesService(limit: number, next: string) {
  var courses = await (CourseModel as any).paginateCourse({
    query: { stage: CourseLifecycleStage.PUBLISHED },
    limit: limit,
    paginatedField: "updatedAt",
    next,
  });

  // Populate lessons
  // TODO: use Promise.all to make concurrent request
  for (let i = 0; i < courses.results.length; i++) {
    let course = courses.results[i];
    course.modules = await Promise.all(
      course.modules.map(async (module) => {
        module.lessons = await CourseLessonModel.find(
          { _id: { $in: module.lessons } },
          "-contents -qna -attachments"
        ).exec();
        return module;
      })
    );
  }

  // Populate instructors
  for (let i = 0; i < courses.results.length; i++) {
    let course = courses.results[i];
    course.instructors = await Promise.all(
      course.instructors.map(async (userId) => {
        return await UserModel.findById(userId)
          .select("-password -__v -createdAt -updatedAt")
          .exec();
      })
    );
  }

  return courses;
}
