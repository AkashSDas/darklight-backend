import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { app } from "../../api";
import User from "../../models/user.schema";

describe("auth controller", () => {
  beforeEach(async function connectToMongoDB() {
    let mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async function disconnectFromMongoDB() {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  // =====================================
  // Signup
  // =====================================

  describe("signup", () => {
    it("with valid data it shoud create new user", async () => {
      let response = await supertest(app).post("/api/v2/auth/signup").send({
        username: "james",
        email: "james@gmail.com",
        password: "testingTEST123@",
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        user: { email: "james@gmail.com" },
      });

      expect(response.body.user.passwordDigest).toBeUndefined();
      expect(response.body).toMatchSnapshot({
        accessToken: expect.any(String),
        user: {
          ...response.body.user,
          _id: expect.any(String),
          userId: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });

      expect(
        response.headers["set-cookie"].find((cookie: string) =>
          cookie.includes("refreshToken")
        )
      ).toBeDefined();
    });

    describe("user already exists", () => {
      beforeEach(async () => {
        await User.create({
          username: "james",
          email: "james@gmail.com",
          passwordDigest: "testingTEST@123",
        });
      });

      it("if user already then given an user exists error", async () => {
        let response = await supertest(app).post("/api/v2/auth/signup").send({
          username: "james",
          email: "james@gmail.com",
          password: "testingTEST@123",
        });

        expect(response.status).toEqual(400);
        expect(response.body).toMatchSnapshot();
      });
    });
  });
});
