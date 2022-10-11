import { FilterQuery } from "mongoose";

import { CourseLessonModel, TCourseLessonClass } from "../models/course-lesson.model";

export async function createCourseLessonService(
  lesson: Partial<TCourseLessonClass>
) {
  return await CourseLessonModel.create(lesson);
}

export async function getCourseLessonService(
  filter: FilterQuery<TCourseLessonClass>
) {
  return await CourseLessonModel.findOne(filter, "-__v").exec();
}

export async function updateCourseLessonService(
  filter: FilterQuery<TCourseLessonClass>,
  update: Partial<TCourseLessonClass>
) {
  return await CourseLessonModel.findOneAndUpdate(filter, update, {
    new: true,
    fields: "-_id -__v",
  }).exec();
}

export async function deleteCourseLessonService(
  filter: FilterQuery<TCourseLessonClass>
) {
  return await CourseLessonModel.findOneAndDelete(filter).exec();
}
