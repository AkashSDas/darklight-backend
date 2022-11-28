import crypto from "crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { DocumentType } from "@typegoose/typegoose";

import User, { UserClass } from "../../_models/user.model";
// import { createUserService, deleteUserService, getUserService, getUserWithSelectService } from "../../_services/user.service";
import { app } from "../../api";
import { userPayload } from "../payload";

describe("AuthController", () => {
  // ==========================
  // Global setup and teardown
  // ==========================

  beforeAll(async function connectToMongoDB() {
    var mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async function disconnectFromMongoDB() {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });

  // ==================================
  // SIGNUP
  // ==================================

  describe("signupController", () => {
    describe("when invalid payload is provided", () => {
      it("should return invalid payload message", async () => {
        var { statusCode, body } = await supertest(app).post(
          "/api/v2/auth/signup"
        );

        expect(statusCode).toBe(400);
        expect(body).toEqual({
          message: "Missing OR invalid fields",
          errors: [
            { field: "username", message: "Required" },
            { field: "email", message: "Required" },
            { field: "password", message: "Required" },
          ],
        });
      });
    });

    describe.skip("when valid payload is provided", () => {
      var userId: string;

      afterAll(async function deleteUser() {
        await User.findByIdAndDelete(userId);
      });

      it("create an account, send verification mail and login the user", async () => {
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/signup")
          .send({
            username: userPayload.username,
            email: userPayload.email,
            password: userPayload.password,
          });

        expect(statusCode).toBe(201);
        expect(body).toMatchObject({
          message: "Account created, verification email sent",
          user: {
            _id: expect.any(String),
            username: userPayload.username,
            email: userPayload.email,
            verified: false,
            active: false,
          },
          accessToken: expect.any(String),
        });

        userId = body.user._id;
      }, 20000);
    });

    describe("when user already exists", () => {
      var userId: string;

      beforeAll(async function createUser() {
        var user = await User.create({
          username: userPayload.username,
          email: userPayload.email,
          password: userPayload.password,
        });

        userId = user._id.toString();
      });

      afterAll(async function deleteUser() {
        await User.findByIdAndDelete(userId);
      });

      it("should return user already exists message", async () => {
        // Creating user
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/signup")
          .send({
            username: userPayload.username,
            email: userPayload.email,
            password: userPayload.password,
          });

        expect(statusCode).toBe(400);
        expect(body).toEqual({ message: "User already exists" });
      });
    });
  });

  describe("cancelOAuthController", () => {
    describe("when user is not authenticated", () => {
      it("should return unauthorized message", async () => {
        var { statusCode, body } = await supertest(app).delete(
          "/api/v2/auth/cancel-oauth"
        );

        expect(statusCode).toBe(401);
        expect(body).toEqual({ message: "Unauthorized" });
      });
    });

    describe("when user is authenticated", () => {
      var accessToken: string;
      var userId: string;

      beforeAll(async function createUser() {
        var user = await User.create({
          username: userPayload.username,
          email: userPayload.email,
          password: userPayload.password,
        });

        accessToken = user.accessToken();
        userId = user._id.toString();
      });

      afterAll(async function deleteUser() {
        await User.findByIdAndDelete(userId);
      });

      it("should cancel oauth signup", async () => {
        var { statusCode, body } = await supertest(app)
          .delete("/api/v2/auth/cancel-oauth")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          user: {
            _id: userId,
            username: userPayload.username,
            email: userPayload.email,
          },
        });

        // Check if the user is deleted in the db
        var user = await User.findById(userId);
        expect(user).toBeNull();
      });
    });
  });

  describe("completeOAuthController", () => {
    var accessToken: string;
    var userId: string;

    beforeAll(async function createUser() {
      var user = await User.create({
        username: userPayload.username,
        email: userPayload.email,
        password: userPayload.password,
      });

      accessToken = user.accessToken();
      userId = user._id.toString();
    });

    afterAll(async function deleteUser() {
      await User.findByIdAndDelete(userId);
    });

    describe("when user is completing oauth signup", () => {
      it("should add compulsory fields to the user", async () => {
        var { statusCode, body } = await supertest(app)
          .put("/api/v2/auth/complete-oauth")
          .send({
            username: userPayload.username,
            email: userPayload.email,
          })
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          user: {
            _id: userId,
            username: userPayload.username,
            email: userPayload.email,
            verified: false,
            active: false,
          },
        });
      });
    });
  });

  // ==================================
  // LOGIN
  // ==================================

  describe("loginController", () => {
    var userId: string;

    beforeAll(async function createUser() {
      var user = await User.create({
        username: userPayload.username,
        email: userPayload.email,
        password: userPayload.password,
      });

      userId = user._id.toString();
    });

    afterAll(async function deleteUser() {
      await User.findByIdAndDelete(userId);
    });

    describe("when logging with correct password", () => {
      it("should login the user", async () => {
        var { statusCode, body, headers } = await supertest(app)
          .post("/api/v2/auth/login")
          .send({
            email: userPayload.email,
            password: userPayload.password,
          });

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          user: {
            _id: userId,
            username: userPayload.username,
            email: userPayload.email,
            verified: false,
            active: false,
          },
          accessToken: expect.any(String),
        });

        var refreshToken = headers["set-cookie"].find((cookie) =>
          cookie.includes("refreshToken")
        );
        expect(refreshToken).toBeDefined();
      });
    });
  });

  describe("accessTokenController", () => {
    var userId: string;
    var refreshToken: string;

    beforeAll(async function createUser() {
      var user = await User.create({
        username: userPayload.username,
        email: userPayload.email,
        password: userPayload.password,
      });

      userId = user._id.toString();
      refreshToken = user.refreshToken();
    });

    afterAll(async function deleteUser() {
      await User.findByIdAndDelete(userId);
    });

    describe("when access token is requested with valid refresh token", () => {
      it("should return access token in response body and cookie", async () => {
        var { statusCode, body } = await supertest(app)
          .get("/api/v2/auth/access-token")
          .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(statusCode).toBe(200);
        expect(body).toMatchObject({
          user: {
            _id: userId,
            username: userPayload.username,
            email: userPayload.email,
            verified: false,
            active: false,
          },
          accessToken: expect.any(String),
        });
      });
    });
  });

  // ==================================
  // EMAIL VERIFICATION
  // ==================================

  describe.skip("verifyEmailController", () => {
    var userId: string;
    var user: DocumentType<UserClass>;

    beforeAll(async function createUser() {
      user = await User.create({
        username: userPayload.username,
        email: userPayload.email,
        password: userPayload.password,
      });

      userId = user._id.toString();
    });

    afterAll(async function deleteUser() {
      await User.findByIdAndDelete(userId);
    });

    describe("when existing user request password", () => {
      it("should send an email with verify user token", async () => {
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/verify-email")
          .send({ email: user.email });

        // Check if the verification token and expires at are set Or not
        var updatedUser = await User.findOne(
          { email: user.email },
          "+verificationToken +verificationTokenExpiresAt"
        );
        expect(updatedUser.verificationToken).toBeDefined();
        expect(updatedUser.verificationTokenExpiresAt).toBeDefined();

        expect(statusCode).toBe(200);
        expect(body).toEqual({ message: "Verification email sent" });
      }, 30000);
    });
  });

  describe("confirmEmailController", () => {
    var userId: string;
    var token: string;
    var user: DocumentType<UserClass>;

    beforeAll(async function createUser() {
      user = await User.create({
        username: userPayload.username,
        email: userPayload.email,
        password: userPayload.password,
      });

      userId = user._id.toString();
      token = user.generateVerificationToken();
      await user.save({ validateModifiedOnly: true });
    });

    afterAll(async function deleteUser() {
      await User.findByIdAndDelete(userId);
    });

    describe("when user request password reset with valid token", () => {
      it("should reset token ", async () => {
        // Check if the verification token and expires at are set Or not
        expect(user.verificationToken).toBeDefined();
        expect(user.verificationTokenExpiresAt).toBeDefined();

        var { statusCode } = await supertest(app).put(
          `/api/v2/auth/confirm-email/${token}`
        );
        expect(statusCode).toBe(301);

        var updatedUser = await User.findOne({ email: user.email });
        expect(updatedUser.verified).toBe(true);
        expect(updatedUser.active).toBe(true);

        // Check if the verification token and expires at are unset Or not
        expect(updatedUser.verificationToken).toBeUndefined();
        expect(updatedUser.verificationTokenExpiresAt).toBeUndefined();
      });
    });
  });

  // ==================================
  // EMAIL VERIFICATION
  // ==================================

  describe.skip("forgotPasswordController", () => {
    var userId: string;
    var user: DocumentType<UserClass>;

    beforeAll(async function createUser() {
      user = await User.create({
        username: userPayload.username,
        email: userPayload.email,
        password: userPayload.password,
      });

      userId = user._id.toString();
    });

    afterAll(async function deleteUser() {
      await User.findByIdAndDelete(userId);
    });

    describe("when existing user requests for password reset", () => {
      it("should send an email with password reset token", async () => {
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/forgot-password")
          .send({ email: user.email });

        // Check if the verification token and expires at are set Or not
        var updatedUser = await User.findOne({ email: user.email }).select(
          "+passwordResetToken +passwordResetTokenExpiresAt"
        );
        expect(updatedUser.passwordResetToken).toBeDefined();
        expect(updatedUser.passwordResetTokenExpiresAt).toBeDefined();

        expect(statusCode).toBe(200);
        expect(body.token).toBeDefined();

        var encryptedToken = crypto
          .createHash("sha256")
          .update(body.token)
          .digest("hex");
        expect(encryptedToken).toEqual(updatedUser.passwordResetToken);
      }, 30000);
    });
  });

  describe("passwordResetController", () => {
    var userId: string;
    var token: string;
    var user: DocumentType<UserClass>;

    beforeAll(async function createUser() {
      user = await User.create({
        username: userPayload.username,
        email: userPayload.email,
        password: userPayload.password,
      });

      userId = user._id.toString();
      token = user.generatePasswordResetToken();
      await user.save({ validateModifiedOnly: true });
    });

    afterAll(async function deleteUser() {
      await User.findByIdAndDelete(userId);
    });

    describe("when user request password reset with valid token", () => {
      it("should reset token", async () => {
        var newPassword = "testingTEST456$";

        // Check if the verification token and expires at are set Or not
        expect(user.passwordResetToken).toBeDefined();
        expect(user.passwordResetTokenExpiresAt).toBeDefined();

        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/auth/password-reset/${token}`)
          .send({ password: newPassword, confirmPassword: newPassword });

        expect(statusCode).toBe(200);
        expect(body).toEqual({ message: "Password reset successfully" });

        var updatedUser = await User.findOne({ email: user.email });

        // Check if the reset token and expires at are unset Or not
        expect(updatedUser.passwordResetToken).toBeUndefined();
        expect(updatedUser.passwordResetTokenExpiresAt).toBeUndefined();

        {
          let { statusCode, body } = await supertest(app)
            .post("/api/v2/auth/login")
            .send({
              email: user.email,
              password: newPassword,
            });

          expect(statusCode).toBe(200);
          expect(body).toMatchObject({
            user: {
              _id: userId,
              username: userPayload.username,
              email: userPayload.email,
              verified: false,
              active: false,
            },
            accessToken: expect.any(String),
          });
        }
      });
    });
  });

  // ==================================
  // LOGOUT
  // ==================================

  describe("logoutController", () => {
    var userId: string;
    var user: DocumentType<UserClass>;
    var accessToken: string;

    beforeAll(async function createUser() {
      user = await User.create({
        username: userPayload.username,
        email: userPayload.email,
        password: userPayload.password,
      });

      userId = user._id.toString();
      accessToken = user.accessToken();
    });

    afterAll(async function deleteUser() {
      await User.findByIdAndDelete(userId);
    });

    describe("when user request logout", () => {
      it("should logout user", async () => {
        var { statusCode, body, headers } = await supertest(app)
          .get("/api/v2/auth/logout")
          .set("Authorization", `Bearer ${accessToken}`);

        expect(statusCode).toBe(200);
        expect(body).toEqual({ message: "Logged out" });

        var refreshToken = headers["set-cookie"].find((cookie) =>
          cookie.includes("refreshToken")
        );
        expect(refreshToken).toBeUndefined();
      });
    });
  });
});
