import supertest from "supertest";

import { describe, it } from "@jest/globals";

import { app } from "../../api";

describe.skip("TestController", () => {
  describe("testController", () => {
    describe("when a request is made", () => {
      it("should return a json response with a message", async () => {
        await supertest(app)
          .get("/api/v2/test")
          .expect(200)
          .expect("Content-Type", /json/)
          .expect({ message: "🪖 Testing" });
      });
    });
  });
});
