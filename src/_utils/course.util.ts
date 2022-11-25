import { DocumentType } from "@typegoose/typegoose";
import cloudinary from "cloudinary";
import { FileArray, UploadedFile } from "express-fileupload";
import { nanoid } from "nanoid";
import { ContentClass, ContentType } from "../_models/content.model";
import { CourseClass } from "../_models/course.model";
import { LessonClass } from "../_models/lesson.model";
import {
  COURSE_COVER_IMG_DIR,
  LESSON_CONTENT_IMAGE_DIR,
  LESSON_VIDEO_DIR,
} from "./cloudinary.util";

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

export async function removeLessonVideo(lesson: DocumentType<LessonClass>) {
  // Delete the old video
  if (lesson.video && lesson.video.id) {
    await cloudinary.v2.uploader.destroy(lesson.video.id, {
      resource_type: "video",
    });
  }
}

export async function uploadLessonVideo(
  file: UploadedFile,
  lesson: DocumentType<LessonClass>,
  courseId: string
) {
  // Delete the old video
  if (lesson.video && lesson.video.id) {
    await cloudinary.v2.uploader.destroy(lesson.video.id, {
      resource_type: "video",
    });
  }

  // Upload new video
  var result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: `${LESSON_VIDEO_DIR}/${courseId}`,
    resource_type: "video",
    filename_override: lesson._id.toString(),
    image_metadata: true,
  });

  return {
    id: result.public_id,
    URL: result.secure_url,
    duration: result.duration,
  };
}

/**
 * data - { type }
 */
export async function updateContentBlock(
  courseId: string,
  lessonId: string,
  content: ContentClass,
  data: {
    id: string;
    type: ContentType;
    data: { key: string; value: any }[] | string;
  },
  files: FileArray
) {
  if (content.type != data.type) throw new TypeError("Content type mismatch");

  switch (content.type) {
    case ContentType.PARAGRAPH:
      if (typeof data.data == "string") return null;
      return {
        ...content,
        data: [
          {
            key: "text",
            value: data.data.find((d) => d.key == "text")?.value ?? "",
          },
        ],
      };
    case ContentType.IMAGE:
      let caption =
        (JSON.parse(data.data.toString()) as any).find(
          (d) => d.key == "caption"
        )?.value ?? null;

      let contentImage = files?.contentImage as UploadedFile;
      if (!contentImage) throw new Error("No image provided");

      // Delete old image, if there
      let id = content.data.find((d) => d.key == "id").value;
      if (id) await cloudinary.v2.uploader.destroy(id);

      // Upload new image
      let result = await cloudinary.v2.uploader.upload(
        contentImage.tempFilePath,
        {
          folder: `${LESSON_CONTENT_IMAGE_DIR}/${courseId}/${lessonId}`,
          filename_override: content.id,
        }
      );

      return {
        ...content,
        data: [
          { key: "id", value: result.public_id },
          { key: "URL", value: result.secure_url },
          { key: "caption", value: caption },
        ],
      };
    case ContentType.H1:
      if (typeof data.data == "string") return null;

      return {
        ...content,
        data: [
          {
            key: "text",
            value: data.data.find((d) => d.key == "text")?.value ?? "",
          },
        ],
      };
    case ContentType.H2:
      if (typeof data.data == "string") return null;

      return {
        ...content,
        data: [
          {
            key: "text",
            value: data.data.find((d) => d.key == "text")?.value ?? "",
          },
        ],
      };
    case ContentType.H3:
      if (typeof data.data == "string") return null;

      return {
        ...content,
        data: [
          {
            key: "text",
            value: data.data.find((d) => d.key == "text")?.value ?? "",
          },
        ],
      };
    case ContentType.QUOTE:
      if (typeof data.data == "string") return null;

      return {
        ...content,
        data: [
          {
            key: "text",
            value: data.data.find((d) => d.key == "text")?.value ?? "",
          },
        ],
      };
    case ContentType.CODE:
      if (typeof data.data == "string") return null;

      return {
        ...content,
        data: [
          {
            key: "text",
            value: data.data.find((d) => d.key == "text")?.value ?? "",
          },
          {
            key: "caption",
            value: data.data.find((d) => d.key == "caption")?.value ?? null,
          },
        ],
      };
    default:
      return content;
  }
}

export function generateContentBlock(type: ContentType) {
  switch (type) {
    case ContentType.PARAGRAPH:
      return {
        id: nanoid(10),
        type: ContentType.PARAGRAPH,
        data: [{ key: "text", value: "" }],
      };
    case ContentType.IMAGE:
      return {
        id: nanoid(10),
        type: ContentType.IMAGE,
        data: [
          { key: "URL", value: null },
          { key: "caption", value: null },
          { key: "id", value: null },
        ],
      };
    case ContentType.H1:
      return {
        id: nanoid(10),
        type: ContentType.H1,
        data: [{ key: "text", value: "" }],
      };
    case ContentType.H2:
      return {
        id: nanoid(10),
        type: ContentType.H2,
        data: [{ key: "text", value: "" }],
      };
    case ContentType.H3:
      return {
        id: nanoid(10),
        type: ContentType.H3,
        data: [{ key: "text", value: "" }],
      };
    case ContentType.DIVIDER:
      return {
        id: nanoid(10),
        type: ContentType.DIVIDER,
        data: [],
      };
    case ContentType.QUOTE:
      return {
        id: nanoid(10),
        type: ContentType.QUOTE,
        data: [{ key: "text", value: "" }],
      };
    case ContentType.CODE:
      return {
        id: nanoid(10),
        type: ContentType.CODE,
        data: [
          { key: "text", value: "" },
          { key: "catpion", value: null },
        ],
      };
    default:
      return null;
  }
}
