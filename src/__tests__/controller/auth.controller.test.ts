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

  // =====================================
  // Login
  // =====================================

  describe("login", () => {
    describe("when user doesn't exists", () => {
      it("then give a 404 response", async () => {
        let response = await supertest(app)
          .post("/api/v2/auth/login")
          .send({ email: "james@gmail.com", password: "testingTEST@123" });

        expect(response.status).toEqual(404);
        expect(response.body).toMatchSnapshot();
      });
    });

    describe("when user exists", () => {
      beforeEach(async () => {
        await User.create({
          email: "james@gmail.com",
          passwordDigest: "testingTEST@123",
        });
      });

      it("then successfully login", async () => {
        let response = await supertest(app)
          .post("/api/v2/auth/login")
          .send({ email: "james@gmail.com", password: "testingTEST@123" });

        expect(response.status).toEqual(200);

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
    });
  });

  describe("access-token", () => {
    let refreshToken: string;

    beforeEach(async () => {
      let user = await User.create({
        email: "james@gmail.com",
        passwordDigest: "testingTEST@123",
      });

      refreshToken = user.getRefreshToken();
    });

    describe("when refresh token is valid", () => {
      it("then successfully get a new access token", async () => {
        let response = await supertest(app)
          .get("/api/v2/auth/access-token")
          .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(response.status).toEqual(200);

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
      });
    });
  });
});
