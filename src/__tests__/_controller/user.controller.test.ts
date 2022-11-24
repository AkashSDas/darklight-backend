import {
  describe,
  it,
  beforeAll,
  afterAll,
  afterEach,
  expect,
} from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";
import { app } from "../../api";
import {
  createUserService,
  deleteUserService,
  getUserService,
} from "../../_services/user.service";
import { UserRole } from "../../_utils/user.util";

var userPayload = {
  username: "james",
  email: "james@gmail.com",
};

describe.skip("User controller", () => {
  beforeAll(async function connectToMongoDB() {
    var mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async function disconnectFromMongoDB() {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  afterEach(async function deleteUser() {
    await deleteUserService({ email: userPayload.email });
  });

  describe("userExistsController", () => {
    describe("given that user with email does not exists", () => {
      it("should return user does not exists", async () => {
        var { statusCode, body } = await supertest(app).get(
          `/api/v2/user/exists?email=${userPayload.email}`
        );

        expect(statusCode).toBe(200);
        expect(body).toEqual({ exists: false });
      });
    });

    describe("given that user with email does exists", () => {
      it("should return user does exists", async () => {
        var user = await createUserService({ email: userPayload.email });
        var { statusCode, body } = await supertest(app).get(
          `/api/v2/user/exists?email=${user.email}`
        );

        expect(statusCode).toBe(200);
        expect(body).toEqual({ exists: true });
      });
    });

    describe("given that user with username does not exists", () => {
      it("should return user does not exists", async () => {
        var { statusCode, body } = await supertest(app).get(
          `/api/v2/user/exists?username=${userPayload.username}`
        );

        expect(statusCode).toBe(200);
        expect(body).toEqual({ exists: false });
      });
    });

    describe("given that user with username does exists", () => {
      it("should return user does exists", async () => {
        var user = await createUserService({ username: userPayload.username });
        var { statusCode, body } = await supertest(app).get(
          `/api/v2/user/exists?username=${user.username}`
        );

        expect(statusCode).toBe(200);
        expect(body).toEqual({ exists: true });
      });
    });

    describe("given that invalid field is used", () => {
      it("should return invalid request", async () => {
        var { statusCode, body } = await supertest(app).get(
          `/api/v2/user/exists?invalid_field=invalid_field`
        );

        expect(statusCode).toBe(400);
        expect(body).toEqual({ message: "Invalid request" });
      });
    });
  });

  describe("getUserController", () => {
    describe("given that is user is not logged in", () => {
      it("should return unauthorized", async () => {
        var { statusCode, body } = await supertest(app).get(`/api/v2/user/me`);

        expect(statusCode).toBe(401);
        expect(body).toEqual({ message: "Unauthorized" });
      });
    });

    describe("given that is user is logged in", () => {
      it("should return user info", async () => {
        var user = await createUserService(userPayload);
        var token = user.accessToken();
        var { statusCode, body } = await supertest(app)
          .get(`/api/v2/user/me`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
          roles: user.roles,
          active: user.active,
          verified: user.verified,
          oauthProviders: user.oauthProviders,
          id: user.id,
          createdAt: ((user as any).createdAt as Date).toISOString(),
          updatedAt: ((user as any).updatedAt as Date).toISOString(),
        });
      });
    });
  });

  describe("instructorSignupController", () => {
    describe("given that the user is not a teacher", () => {
      it("should assign the teacher role", async () => {
        var user = await createUserService(userPayload);
        var token = user.accessToken();
        var { statusCode } = await supertest(app)
          .post(`/api/v2/user/instructor-signup`)
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(200);

        var updatedUser = await getUserService({ _id: user._id });
        expect(updatedUser.roles).toContain(UserRole.TEACHER);
      });
    });
  });
});
