import { toError } from "./toError";

describe("toError", () => {
  it("should return error itself", () => {
    const e = new SyntaxError("test error");
    expect(toError(e)).toBe(e);
  });

  it("should return error message", () => {
    const e = {
      message: "dummy error",
    };
    expect(toError(e)).toEqual(new Error("dummy error"));
  });

  it("should return default message for object", () => {
    const e = {};
    expect(toError(e)).toEqual(new Error("unknown error"));
  });

  it("should return default message for other types", () => {
    expect(toError(undefined)).toEqual(new Error("unknown error"));
  });
});
