import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";
import { app } from "../../api";
import { createUserService } from "../../_services/user.service";

var userPayload = {
  username: "james",
  email: "james@gmail.com",
};

describe("User controller", () => {
  beforeAll(async function connectToMongoDB() {
    var mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async function disconnectFromMongoDB() {
    await mongoose.disconnect();
    await mongoose.connection.close();
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
});
