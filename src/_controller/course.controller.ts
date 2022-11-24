import { Request, Response } from "express";
import { Course } from "../_models/course.model";
import { Settings } from "../_schema/course.schema";
import { UploadedFile } from "express-fileupload";
import { updateCourseCoverImage } from "../_utils/cloudinary.util";
import { allowedCourseSettings } from "../_utils/course.util";

// ==================================
// COURSE SETTINGS CONTROLLERS
// ==================================

/**
 * Update course settings
 *
 * @remark Settings that are updated are:
 * - emoji
 * - title
 * - description
 * - stage
 * - price
 * - difficulty
 * - tags
 * - coverImage
 * - faqs
 *
 * @remark Middlewares used:
 * - verifyAuth
 * - validateCourseOwnership
 */
export async function updateSettings(
  req: Request<Settings["params"], {}, Settings["body"]>,
  res: Response
) {
  // Cost is only 1 request to database (when there is no cover image)
  if (req.files?.coverImage == undefined) {
    // This check whether the course exists and whether the user is an instructor
    let course = await Course.findOneAndUpdate(
      { _id: req.params.courseId, instructors: req.user._id },
      { $set: { ...req.body } },
      { new: true, fields: "-__v" }
    );

    if (!course) return res.status(404).json({ message: "Course not found" });
    return res.status(200).json({ course });
  } else {
    let course = await Course.findOne({
      _id: req.params.courseId,
      instructors: req.user._id,
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Upload cover image
    let file = req.files.coverImage as UploadedFile;
    let image = await updateCourseCoverImage(file, course);

    // Update course
    for (let key in req.body) {
      if (key in allowedCourseSettings) {
        course[key] = req.body[key];
      }
    }
    course.coverImage = image;
    await course.save();

    return res.status(200).json({ course });
  }
}
