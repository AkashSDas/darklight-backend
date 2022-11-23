import {
  describe,
  it,
  expect,
  afterEach,
  afterAll,
  beforeAll,
} from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";
import { app } from "../../api";
import {
  createUserService,
  deleteUserService,
} from "../../_services/user.service";

var userPayload = {
  username: "rock",
  email: "rock@gmail.com",
  password: "testing",
};

var loginPayload = {
  email: userPayload.email,
  password: userPayload.password,
};

describe("Auth controller", () => {
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

  // ==================================
  // SIGNUP CONTROLLER
  // ==================================

  describe("signupController", () => {
    describe("given that response body is invalid", () => {
      it("should give response of 400 with errors and a message", async () => {
        var { statusCode, body } = await supertest(app).post(
          "/api/v2/auth/signup"
        );
        expect(statusCode).toBe(400);
        expect(body).toMatchObject({ message: "Missing OR invalid fields" });
        expect(body).toMatchObject({ errors: expect.any(Array) });
      });
    });

    // Skipping this test because it sends an email
    describe.skip("given that user has unqiue username and password", () => {
      it("should create user and return response containing user and access token", async () => {
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/signup")
          .send(userPayload);

        expect(statusCode).toBe(201);
        expect(body).toEqual({
          user: expect.any(Object),
          accessToken: expect.any(String),
          message: expect.any(String),
        });

        // Timeout for sending email
      }, 20000);
    });

    describe("given that user's email is already used (same for the username)", () => {
      it("should return response with error message", async () => {
        await createUserService(userPayload);

        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/signup")
          .send(userPayload);

        expect(statusCode).toBe(400);
        expect(body).toEqual({ message: expect.any(String) });
      });
    });
  });

  describe("cancelOAuthController", () => {
    describe("given that the user is not logged in", () => {
      it("should return response with error message", async () => {
        var { statusCode, body } = await supertest(app).delete(
          "/api/v2/auth/cancel-oauth"
        );

        expect(statusCode).toBe(401);
        expect(body).toEqual({ message: expect.any(String) });
      });
    });

    // TODO: This is for user authenticated with OAuth during signup
    // and wants to cancel the signup process
    describe("given that the user is logged in using oauth", () => {
      it.todo("should delete the user and logout it out");
    });
  });

  describe("completeOAuthController", () => {
    describe("given that the user is not logged in", () => {
      it("should return response with error message", async () => {
        var { statusCode } = await supertest(app).put(
          "/api/v2/auth/complete-oauth"
        );

        expect(statusCode).toBe(400);
      });
    });

    describe("given the user doesn't exists", () => {
      it.todo("should give an error with status 404");
    });

    describe("given the user exists", () => {
      it.todo("should complete user's signup process");
    });
  });

  // ==================================
  // LOGIN CONTROLLER
  // ==================================

  describe("loginController", () => {
    describe("given that the user doesn't exists", () => {
      it("should return response with error message", async () => {
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/login")
          .send(loginPayload);

        expect(statusCode).toBe(400);
        expect(body).toEqual({ message: "Invalid email or password" });
      });
    });

    describe("given that the password is incorrect", () => {
      it("should throw an error", async () => {
        await createUserService(userPayload);

        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/login")
          .send({ ...loginPayload, password: "wrong password" });

        expect(statusCode).toBe(401);
        expect(body).toEqual({ message: "Incorrect password" });
      });
    });

    describe("given that the the password is correct", () => {
      it("should return user and an access token", async () => {
        await createUserService(userPayload);

        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/login")
          .send(loginPayload);

        expect(statusCode).toBe(200);
        expect(body).toEqual({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });
  });

  describe("accessTokenController", () => {
    describe("given that there is no refresh token", () => {
      it("should given an unauthorized error", async () => {
        var { statusCode, body } = await supertest(app).get(
          "/api/v2/auth/access-token"
        );

        expect(statusCode).toBe(401);
        expect(body).toEqual({ message: "Unauthorized" });
      });
    });

    describe("given that the user has a valid refresh token", () => {
      it("should return the new access token along with the user", async () => {
        var user = await createUserService(userPayload);
        var refreshToken = user.refreshToken();

        var { statusCode, body } = await supertest(app)
          .get("/api/v2/auth/access-token")
          .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(statusCode).toBe(200);
        expect(body).toEqual({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });

    describe("given that the user has a invalid refresh token", () => {
      it("should throw an invalid token error", async () => {
        await createUserService(userPayload);
        var refreshToken = "invalid token";

        var { statusCode, body } = await supertest(app)
          .get("/api/v2/auth/access-token")
          .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(statusCode).toBe(401);
        expect(body).toEqual({ message: "Invalid refresh token" });
      });
    });

    describe("given that the user doesn't exists but there's a valid refresh token", () => {
      it("should throw a user not found error", async () => {
        var user = await createUserService(userPayload);
        var refreshToken = user.refreshToken();
        await deleteUserService({ email: user.email });

        var { statusCode, body } = await supertest(app)
          .get("/api/v2/auth/access-token")
          .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(statusCode).toBe(404);
        expect(body).toEqual({ message: "User not found" });
      });
    });
  });
});
