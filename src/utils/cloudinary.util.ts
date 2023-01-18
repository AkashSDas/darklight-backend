import cloudinary from "cloudinary";

import { getEnv } from "./config";

export async function connectToCloudinary() {
  cloudinary.v2.config({
    cloud_name: getEnv().cloudinary.cloudName,
    api_key: getEnv().cloudinary.apiKey,
    api_secret: getEnv().cloudinary.apiSecret,
  });
}

export const COURSE_COVER_IMG_DIR = "darklight/courses/cover-images";
export const LESSON_VIDEO_DIR = "darklight/courses/lesson-videos";
export const LESSON_ATTACHMENT = "darklight/courses/lesson-attachments";
export const LESSON_CONTENT_IMAGE_DIR = "darklight/courses/lesson-images";
export const USER_PROFILE = "darklight/users/profile-images";
