import { describe, it, expect, afterAll, beforeAll } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";
import { app } from "../../api";
import { createUserService } from "../../_services/user.service";

var userPayload = {
  username: "james",
  email: "james@gmail.com",
  password: "testing",
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
    describe("given that user is not logged in", () => {
      it("should return response with error message", async () => {
        var { statusCode, body } = await supertest(app).post(
          "/api/v2/auth/cancel-oauth"
        );

        expect(statusCode).toBe(401);
        expect(body).toEqual({ message: expect.any(String) });
      });
    });
  });
});