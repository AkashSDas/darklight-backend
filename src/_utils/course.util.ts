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

export var allowedCourseSettings = [
  "emoji",
  "title",
  "description",
  "stage",
  "price",
  "difficulty",
  "tags",
  "faqs",
];
