import { withPrevious } from "./withPrevious";

describe("withPrevious", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should provide previous element as metadata", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = withPrevious();
    obj.init?.(control as any);
    obj.onItem("first", { meta: 1 }, control as any);
    obj.onItem("second", { meta: 2 }, control as any);
    obj.onItem("third", { meta: 3 }, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      [
        {
          current: "second",
          previous: { value: "first", metadata: { meta: 1 } },
        },
        { meta: 2 },
      ],
      [
        {
          current: "third",
          previous: { value: "second", metadata: { meta: 2 } },
        },
        { meta: 3 },
      ],
    ]);
  });
});
