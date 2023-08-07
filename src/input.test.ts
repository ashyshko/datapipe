import { input } from "./input";

describe("input", () => {
  it("should transfer init callback", () => {
    const init = jest.fn();
    const obj = input(init);
    expect(obj.init).toBe(init);
  });

  it("should throw on item/error/eof", () => {
    const init = jest.fn();
    const obj = input(init);
    // @ts-expect-error item and metadata have 'never' type
    expect(() => obj.onItem(1 as any, 2 as any, {} as any)).toThrow(
      "onItem called for input",
    );

    expect(() => obj.onError(new Error("dummy error"), {} as any)).toThrow(
      "onError called for input",
    );

    expect(() => obj.onEof({} as any)).toThrow("onEof called for input");
  });
});
