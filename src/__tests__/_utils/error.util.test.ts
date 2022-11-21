import { describe, expect, it, jest } from "@jest/globals";

import { BaseApiError } from "../../_utils/error.util";

describe("[utils] error", () => {
  describe("[BaseApiError]", () => {
    describe("given that an error is thrown", () => {
      it("should throw BaseApiError", () => {
        var fn = jest.fn(() => {
          throw new BaseApiError(404, "Not found");
        });

        expect(fn).toThrowError(new BaseApiError(404, "Not found"));
      });

      it("should return error message and status code", () => {
        var fn = jest.fn(() => {
          throw new BaseApiError(404, "Not found");
        });

        try {
          fn();
        } catch (error) {
          expect(error).toBeInstanceOf(BaseApiError);

          if (error instanceof BaseApiError) {
            expect(error.message).toBe("Not found");
            expect(error.status).toBe(404);
          }
        }
      });
    });
  });

  describe("[sendErrorResponse]", () => {
    describe("given that an error has occurred", () => {
      it.todo("should send error response");
    });
  });
});
