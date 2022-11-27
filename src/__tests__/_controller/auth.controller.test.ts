import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import supertest from "supertest";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "@jest/globals";

import { createUserService, deleteUserService, getUserService, getUserWithSelectService } from "../../_services/user.service";
import { app } from "../../api";
import { user } from "../payload";

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

  // ==========================
  // Signup
  // ==========================

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
            { field: "username", msg: "Required" },
            { field: "email", msg: "Required" },
            { field: "password", msg: "Required" },
          ],
        });
      });
    });

    describe.skip("when valid payload is provided", () => {
      it("create an account, send verification mail and login the user", async () => {
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/signup")
          .send({
            username: user.username,
            email: user.email,
            password: user.password,
          });

        expect(statusCode).toBe(201);
        expect(body).toMatchObject({
          message: "Account created, verification email sent",
          user: {
            _id: expect.any(String),
            username: user.username,
            email: user.email,
            verified: false,
            active: false,
          },
          accessToken: expect.any(String),
        });
      }, 20000);
    });

    describe("when user already exists", () => {
      beforeAll(async function createUser() {
        await supertest(app).post("/api/v2/auth/signup").send({
          username: user.username,
          email: user.email,
          password: user.password,
        });
      });

      it("should return user already exists message", async () => {
        // Creating user
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/signup")
          .send({
            username: user.username,
            email: user.email,
            password: user.password,
          });

        expect(statusCode).toBe(400);
        expect(body).toEqual({ message: "User already exists" });
      });
    });
  });
});

var userPayload = {
  username: "rock",
  email: "rock@gmail.com",
  password: "testing",
};

var loginPayload = {
  email: userPayload.email,
  password: userPayload.password,
};

describe.skip("Auth controller", () => {
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

  describe("verifyEmailController", () => {
    describe("given that the user doesn't exists", () => {
      it("should throw an error", async () => {
        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/verify-email")
          .send({ email: "non-existing-email@gmail.com" });

        expect(statusCode).toBe(404);
        expect(body).toEqual({ message: "User not found" });
      });
    });

    // Skipping this test because it sends an email
    describe.skip("given that the user exists", () => {
      it("should send an email and return a verify token", async () => {
        var user = await createUserService(userPayload);

        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/verify-email")
          .send({ email: user.email });

        // Check if the verification token and expires at are set Or not
        var updatedUser = await getUserWithSelectService(
          { email: user.email },
          "+verificationToken +verificationTokenExpiresAt"
        );
        expect(updatedUser.verificationToken).toBeDefined();
        expect(updatedUser.verificationTokenExpiresAt).toBeDefined();

        expect(statusCode).toBe(200);
        expect(body).toEqual({
          message: "Verification email sent",
          token: expect.any(String),
        });
      }, 30000);
    });
  });

  describe("confrimEmailController", () => {
    describe("given a valid token", () => {
      it("should verify the user and make the account active", async () => {
        var user = await createUserService(userPayload);
        var token = user.generateVerificationToken();
        await user.save();

        // Check if the verification token and expires at are set Or not
        expect(user.verificationToken).toBeDefined();
        expect(user.verificationTokenExpiresAt).toBeDefined();

        var { statusCode } = await supertest(app).put(
          `/api/v2/auth/confirm-email/${token}`
        );
        expect(statusCode).toBe(301);

        var updatedUser = await getUserService({ email: user.email });
        expect(updatedUser.verified).toBe(true);
        expect(updatedUser.active).toBe(true);

        // Check if the verification token and expires at are unset Or not
        expect(updatedUser.verificationToken).toBeUndefined();
        expect(updatedUser.verificationTokenExpiresAt).toBeUndefined();
      });
    });

    describe("given a invalid token", () => {
      it("should return an error", async () => {
        var user = await createUserService(userPayload);
        user.generateVerificationToken();
        await user.save();
        var token = "invalid token";

        var { statusCode, body } = await supertest(app).put(
          `/api/v2/auth/confirm-email/${token}`
        );
        expect(statusCode).toBe(400);
        expect(body).toEqual({ message: "Invalid or expired token" });
      });
    });

    describe("given a expired token", () => {
      it.todo("should return an error and delete the token from the database");
    });
  });

  // Skipping this test because it sends an email
  describe.skip("forgotPasswordController", () => {
    describe("given that a user has valid email", () => {
      it("should send an email and return reset password token", async () => {
        var user = await createUserService(userPayload);

        var { statusCode, body } = await supertest(app)
          .post("/api/v2/auth/forgot-password")
          .send({ email: user.email });

        // Check if the reset password token and expires at are set Or not
        var updatedUser = await getUserWithSelectService(
          { email: user.email },
          "+passwordResetToken +passwordResetTokenExpiresAt"
        );
        expect(updatedUser.passwordResetToken).toBeDefined();
        expect(updatedUser.passwordResetTokenExpiresAt).toBeDefined();

        expect(statusCode).toBe(200);
        expect(body).toEqual({ token: expect.any(String) });
      });
    });
  });

  describe("resetPasswordController", () => {
    describe("given that the password reset token is valid", () => {
      it("should reset the password and unset the it's token related fields", async () => {
        var user = await createUserService(userPayload);
        var token = user.generatePasswordResetToken();
        await user.save();

        // Check if the fields are set
        var updatedUser = await getUserWithSelectService(
          { email: user.email },
          "+passwordResetToken +passwordResetTokenExpiresAt"
        );
        expect(updatedUser.passwordResetToken).toBeDefined();
        expect(updatedUser.passwordResetTokenExpiresAt).toBeDefined();

        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/auth/password-reset/${token}`)
          .send({ password: "newPassword", confirmPassword: "newPassword" });

        expect(statusCode).toBe(200);
        expect(body).toEqual({ message: "Password reset successfully" });

        var updatedUser2 = await getUserWithSelectService(
          { email: user.email },
          "+passwordResetToken +passwordResetTokenExpiresAt"
        );
        expect(updatedUser2.passwordResetToken).toBeUndefined();
        expect(updatedUser2.passwordResetTokenExpiresAt).toBeUndefined();
      });
    });

    describe("given that the password reset token is invalid", () => {
      it("should throw an error", async () => {
        var user = await createUserService(userPayload);
        user.generatePasswordResetToken();
        await user.save();
        var token = "invalid token";

        var { statusCode, body } = await supertest(app)
          .put(`/api/v2/auth/password-reset/${token}`)
          .send({ password: "newPassword", confirmPassword: "newPassword" });

        expect(statusCode).toBe(400);
        expect(body).toEqual({ message: "Invalid or expired token" });
      });
    });
  });

  describe("logoutController", () => {
    describe("given that user is logged in", () => {
      it("should logout the user", async () => {
        var user = await createUserService(userPayload);
        var token = user.accessToken();

        var { statusCode, body } = await supertest(app)
          .get("/api/v2/auth/logout")
          .set("Authorization", `Bearer ${token}`);

        expect(statusCode).toBe(200);
        expect(body).toEqual({ message: "Logged out successfully" });
      });
    });
  });
});
