import { DocumentType } from "@typegoose/typegoose";
import cloudinary from "cloudinary";
import { UploadedFile } from "express-fileupload";
import { CourseClass } from "../_models/course.model";

export async function connectToCloudinary() {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const COURSE_COVER_IMG_DIR = "darklight/courses/cover-images";

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
    folder: COURSE_COVER_IMG_DIR,
    crop: "scale",
  });

  return { id: result.public_id, URL: result.secure_url };
}
