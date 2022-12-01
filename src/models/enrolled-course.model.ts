import { getModelForClass, plugin, prop, Ref, Severity } from "@typegoose/typegoose";
import MongoPaging from "mongo-cursor-pagination";
import { SchemaTypes } from "mongoose";
import { CourseClass } from "./course.model";
import { LessonClass } from "./lesson.model";
import { UserClass } from "./user.model";

class ProgressClass {
    @prop({ type: SchemaTypes.ObjectId, ref: () => LessonClass, required: true })
    lesson: Ref<LessonClass>;

    @prop({ type: SchemaTypes.Boolean, default: false, required: true })
    done: number;
}

@plugin(MongoPaging.mongoosePlugin, { name: "paginateEnrolledCourse" })
export class EnrolledCourseClass {
    @prop({ ref: () => UserClass, required: true })
    user: Ref<UserClass>

    @prop({ ref: () => CourseClass, required: true })
    course: Ref<CourseClass>

    @prop({ type: SchemaTypes.Array, required: true })
    progress: ProgressClass[]


    @prop({ type: SchemaTypes.Number, required: true, min: 0, default: 0 })
    price: number
}

export var EnrolledCourse = getModelForClass(EnrolledCourseClass, {
    schemaOptions: {
        timestamps: true,
        toJSON: { virtuals: true },
        typeKey: "type",
    },
    options: { allowMixed: Severity.ALLOW, customName: "enrolled-course" },
});