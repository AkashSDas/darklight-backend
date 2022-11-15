import { CourseProfile } from "../models/course-profile";

export async function createCourseProfileService(
  userId: string,
  courseId: string
) {
  return await CourseProfile.create({
    user: userId,
    course: courseId,
    purchasedInfo: {
      purchasedAt: Date.now(),
    },
  });
}

export async function courseProfileExistsService(
  userId: string,
  courseId: string
) {
  return await CourseProfile.exists({
    user: userId,
    course: courseId,
  });
}

export async function getCourseProfileService(
  userId: string,
  courseId: string
) {
  return await CourseProfile.findOne({
    user: userId,
    course: courseId,
  });
}

export async function getCourseProfilesService(userId: string) {
  return await CourseProfile.find({
    user: userId,
  });
}

export async function updateCourseProfileService(
  userId: string,
  courseId: string,
  update: any
) {
  return await CourseProfile.findOneAndUpdate(
    { user: userId, course: courseId },
    update,
    { new: true }
  );
}
