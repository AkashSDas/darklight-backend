import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { DocumentType } from "@typegoose/typegoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";
import { app } from "../../api";
import { Course, CourseClass } from "../../_models/course.model";
import { UserClass } from "../../_models/user.model";
import {
  createUserService,
  updateUserService,
} from "../../_services/user.service";
import { UserRole } from "../../_utils/user.util";
import path from "path";
import { connectToCloudinary } from "../../_utils/cloudinary.util";
import { Lesson, LessonClass } from "../../_models/lesson.model";
import { ContentType } from "../../_models/content.model";

var userPayload = {
  username: "james",
  email: "james@gmail.com",
  password: "testing",
};

function createGroup(label: string) {
  return {
    title: label,
    _id: new mongoose.Types.ObjectId(),
    lessons: [],
    lastEditedOn: new Date(Date.now()),
  };
}

describe("Course controllers", () => {
  var user: DocumentType<UserClass>;
  var token: string;

  beforeAll(async function connectToMongoDB() {
    var mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    await connectToCloudinary();
  });

  beforeAll(async function deleteUser() {
    user = await createUserService({
      email: userPayload.email,
      roles: [UserRole.STUDENT, UserRole.TEACHER],
    });
    token = user.accessToken();
  });

  afterAll(async function disconnectFromMongoDB() {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  describe("createCourse", () => {
    describe("given that user is not a teacher", () => {
      it("should return forbidden", async () => {
        // Remove teacher role
        await updateUserService(user._id, { roles: [UserRole.STUDENT] });

        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(403);
        expect(body).toEqual({ message: "Forbidden" });

        // Add back teacher role
        await updateUserService(user._id, {
          roles: [UserRole.STUDENT, UserRole.TEACHER],
        });
      });
    });

    describe("given that the user is a teacher", () => {
      it("should create a course", async () => {
        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(201);
        expect(body.course).toHaveProperty("_id");
        expect(body.course).toHaveProperty("lastEditedOn");
        expect(body).toMatchObject({
          course: {
            stage: "draft",
            difficulty: "beginner",
            instructors: [user._id.toString()],
            tags: [],
            faqs: [],
            groups: [],
            enrolled: 0,
            ratings: 0,
          },
        });
      });
    });
  });

  describe("updateSettings", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that the instructor is updating the course", () => {
      it("should update the course (without cover image)", async () => {
        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/course/${course._id}/settings`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            emoji: "👍",
            title: "Test title",
            description: "Test description",
            stage: "published",
            price: 300,
            difficulty: "intermediate",
            tags: ["test", "tags"],
            faqs: [{ question: "Test question", answer: "Test answer" }],
          });

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          course: {
            emoji: "👍",
            title: "Test title",
            description: "Test description",
            stage: "published",
            price: 300,
            difficulty: "intermediate",
            tags: ["test", "tags"],
            faqs: [{ question: "Test question", answer: "Test answer" }],
          },
        });
      });
    });
  });

  // Skipping this test because it upload image to the cloudinary
  describe.skip("updateCoverImageController", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that the instructor is updating the course", () => {
      it("update course cover image", async () => {
        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/course/${course._id}/cover`)
          .set("Authorization", `Bearer ${token}`)
          .attach(
            "coverImage",
            path.resolve(__dirname, "../../../media/cover-image.jpg")
          );

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          image: { id: expect.any(String), URL: expect.any(String) },
        });
      }, 30000);
    });
  });

  // ============================
  // GROUP
  // ============================

  describe("createGroupController", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that the instructor is creating a group", () => {
      it("should create a group", async () => {
        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course/${course._id}/group`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(201);
        expect(body).toMatchObject({ group: { lessons: [] } });
      });
    });

    describe("given that the lesson doesn't exists", () => {
      it("should return Forbidden message", async () => {
        var invalidId = new mongoose.Types.ObjectId();
        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course/${invalidId}/group`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(403);
        expect(body).toMatchObject({ message: "Forbidden" });
      });
    });
  });

  describe("updateGroupController", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that course settings is updated", () => {
      it("should update the course", async () => {
        var group = {
          _id: new mongoose.Types.ObjectId(),
          lessons: [],
          lastEditedOn: new Date(Date.now()),
        };
        course.groups.push(group as any);
        await course.save();

        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/course/${course._id}/group/${group._id}`)
          .set("Authorization", `Bearer ${token}`)
          .send({
            emoji: "👍",
            title: "Test title",
            description: "Test description",
          });

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          group: {
            emoji: "👍",
            title: "Test title",
            description: "Test description",
          },
        });
      });
    });
  });

  describe("reorderLessonsController", () => {
    var course: DocumentType<CourseClass>;

    beforeAll(async () => {
      course = new Course();
      course.instructors.push(user._id);
      await course.save();
    });

    describe("given that the new order is sent", () => {
      it("should update the order of the lessons", async () => {
        var lesson1 = new mongoose.Types.ObjectId();
        var lesson2 = new mongoose.Types.ObjectId();
        var lesson3 = new mongoose.Types.ObjectId();
        var lesson4 = new mongoose.Types.ObjectId();

        var group = {
          _id: new mongoose.Types.ObjectId(),
          lessons: [lesson1, lesson2, lesson3, lesson4],
          lastEditedOn: new Date(Date.now()),
        };
        course.groups.push(group as any);
        await course.save();

        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/course/${course._id}/group/${group._id}/reorder`)
          .set("Authorization", `Bearer ${token}`)
          .send({ lessons: [lesson3, lesson2, lesson1, lesson4] });

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          group: {
            lessons: [lesson3, lesson2, lesson1, lesson4],
          },
        });
      });
    });
  });

  // ============================
  // LESSON
  // ============================

  describe("createLessonController", () => {
    var course: DocumentType<CourseClass>;
    var groupId = new mongoose.Types.ObjectId();

    beforeAll(async () => {
      course = new Course({
        groups: [
          {
            _id: groupId,
            lessons: [],
            lastEditedOn: new Date(Date.now()),
          },
        ],
      });
      course.instructors.push(user._id);
      await course.save();
    });

    // MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
    describe.skip("given that the instructor is creating a lesson", () => {
      it("should create a lesson", async () => {
        var { statusCode, body } = await supertest(app)
          .post(`/api/v2/course/${course._id}/group/${groupId}/lesson`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(201);
        expect(body).toMatchObject({ lesson: { content: [] } });
      });
    });
  });

  describe.only("Content", () => {
    var course: DocumentType<CourseClass>;
    var lesson: DocumentType<LessonClass>;
    var groupId: mongoose.Types.ObjectId;

    beforeAll(async () => {
      // Create course and groups
      course = new Course();
      course.instructors.push(user._id);
      var grp1 = createGroup("Group 1") as any;
      groupId = grp1._id;
      var grp2 = createGroup("Group 2") as any;
      course.groups.push(grp1);
      course.groups.push(grp2);
      await course.save();

      // Create lessons and update course
      lesson = new Lesson();
      var lesson2 = new Lesson();
      var idx = course.groups.findIndex((g) => g._id == grp1._id);
      var grp = course.groups[idx];
      grp.lessons.push(lesson._id);
      grp.lessons.push(lesson2._id);
      course.groups[idx] = grp;

      // TODO: have a transaction here
      await course.save();
      await lesson.save();
      await lesson2.save();
    });

    describe("add content", () => {
      describe("given a valid type of content", () => {
        it("should create a content block", async () => {
          var { statusCode, body } = await supertest(app)
            .post(
              `/api/v2/course/${course._id}/group/${groupId}/lesson/${lesson._id}/content`
            )
            .set("Authorization", `Bearer ${token}`)
            .send({ type: ContentType.PARAGRAPH });

          expect(statusCode).toBe(201);
          expect(body).toMatchObject({
            content: {
              id: expect.any(String),
              type: ContentType.PARAGRAPH,
              data: expect.any(Array),
            },
          });

          var updatedLesson = await Lesson.findById(lesson._id);
          expect(updatedLesson?.content).toHaveLength(1);
          expect(updatedLesson?.content[0].type).toBe(ContentType.PARAGRAPH);
          expect(updatedLesson?.content[0].id).toBe(body.content.id);
        });
      });
    });
  });
});
