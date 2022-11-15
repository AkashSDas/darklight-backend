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
