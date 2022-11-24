import { DocumentType } from "@typegoose/typegoose";
import cloudinary from "cloudinary";
import { UploadedFile } from "express-fileupload";
import { CourseClass } from "../_models/course.model";
import { COURSE_COVER_IMG_DIR } from "./cloudinary.util";

export enum CourseStage {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export enum CourseDifficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum FileType {
  VIDEO = "video",
  AUDIO = "audio",
  DOCUMENT = "document",
  IMAGE = "image",
}

// COURSE

export async function updateCourseCoverImage(
  file: UploadedFile,
  course: DocumentType<CourseClass>
) {
  // Check if the course already as an image, if it's with id
  // then delete it else upload the new image and update the
  // course with the new image id and URL

  if (course.coverImage && course.coverImage.id) {
    // Delete image from cloudinary
    await cloudinary.v2.uploader.destroy(course.coverImage.id);
  }

  // Upload the new image in cloudinary
  var result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: `${COURSE_COVER_IMG_DIR}/${course._id}`,
    crop: "scale",
  });

  return { id: result.public_id, URL: result.secure_url };
}
