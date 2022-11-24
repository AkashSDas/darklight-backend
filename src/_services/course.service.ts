import { FilterQuery } from "mongoose";
import { Course, CourseClass } from "../_models/course.model";

export function getCourseService(filter: FilterQuery<CourseClass>) {
  return Course.findOne(filter);
}

export function updateUsingSetCourseService(
  filter: FilterQuery<CourseClass>,
  update: Partial<CourseClass>
) {
  return Course.findOneAndUpdate(
    filter,
    { $set: update },
    { new: true, fields: "-__v" }
  );
}
