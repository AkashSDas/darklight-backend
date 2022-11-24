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

    describe("given that the instructor is updating the course", () => {
      it.todo("update course cover image");
    });
  });
});
