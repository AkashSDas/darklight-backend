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

var userPayload = {
  username: "james",
  email: "james@gmail.com",
  password: "testing",
};

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
});
