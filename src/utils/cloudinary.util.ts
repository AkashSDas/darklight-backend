import cloudinary from "cloudinary";

export async function connectToCloudinary() {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });
}

export const COURSE_COVER_IMG_DIR = "darklight/courses/cover-images";
export const LESSON_VIDEO_DIR = "darklight/courses/lesson-videos";
export const LESSON_ATTACHMENT = "darklight/courses/lesson-attachments";
export const LESSON_CONTENT_IMAGE_DIR = "darklight/courses/lesson-images";
export const USER_PROFILE = "darklight/users/profile-images";
