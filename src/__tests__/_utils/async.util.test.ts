import { describe, expect, it, jest } from "@jest/globals";

import { handleAsync, handleMiddlewareError } from "../../_utils/async.util";

describe("[utils] async", () => {
  describe("[handleAsync]", () => {
    describe("given that the promise is resolved", () => {
      it("should return data and no error in an object", async () => {
        var { data, error } = await handleAsync(Promise.resolve("data"));
        expect(data).toBe("data");
        expect(error).toBeNull();
      });
    });

    describe("given that the promise is rejected", () => {
      it("should handle the error and return an object with error no data", async () => {
        var { data, error } = await handleAsync(Promise.reject("error"));
        expect(data).toBeNull();
        expect(error).toBe("error");
      });
    });
  });

  describe("[handleMiddlewareError]", () => {
    describe("given that an error occurred", () => {
      it("should call the next function with the error", async () => {
        var next = jest.fn();
        var fn = jest
          .fn<() => Promise<never>>()
          .mockRejectedValue(new Error("error inside the async middleware"));

        await handleMiddlewareError(fn)(null, null, next);

        expect(fn).toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
          new Error("error inside the async middleware")
        );
      });
    });
  });
});
