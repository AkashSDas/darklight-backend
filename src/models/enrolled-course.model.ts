import MongoPaging from "mongo-cursor-pagination";
import { SchemaTypes } from "mongoose";

import { getModelForClass, plugin, prop, Ref, Severity } from "@typegoose/typegoose";

import { CourseClass } from "./course.model";
import { LessonClass } from "./lesson.model";
import { UserSchema } from "./user.schema";

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

@plugin(MongoPaging.mongoosePlugin, { name: "paginateEnrolledCourse" })
export class EnrolledCourseClass {
  @prop({ ref: () => UserSchema, required: true })
  user: Ref<UserSchema>;

  @prop({ ref: () => CourseClass, required: true })
  course: Ref<CourseClass>;

  @prop({ type: SchemaTypes.Number, required: true, min: 0 })
  pricePayed: number;

  @prop({ type: SchemaTypes.Array, required: true, default: [] })
  doneLessons: Ref<LessonClass>[];

  @prop({
    type: SchemaTypes.String,
    required: true,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @prop({ type: SchemaTypes.String })
  paymentIntent?: string;
}

export var EnrolledCourse = getModelForClass(EnrolledCourseClass, {
  schemaOptions: {
    timestamps: true,
    toJSON: { virtuals: true },
    typeKey: "type",
  },
  options: { allowMixed: Severity.ALLOW, customName: "enrolled-course" },
});
