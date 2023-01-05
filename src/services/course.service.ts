import { FilterQuery } from "mongoose";

import { CourseClass } from "../models/course.model";
import { Course } from "../models";

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
