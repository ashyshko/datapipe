import { withPrevious } from "./withPrevious";

describe("withPrevious", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should provide previous element as metadata", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const handler = {
      onItem: jest.fn(),
    };

    const obj = withPrevious(handler);
    obj.init?.(control as any);
    obj.onItem("first", { meta: 1 }, control as any);
    obj.onItem("second", { meta: 2 }, control as any);
    obj.onItem("third", { meta: 3 }, control as any);
    obj.onEof(control as any);
    await new Promise(process.nextTick);
    expect(handler.onItem.mock.calls).toEqual([
      [
        "second",
        { meta: 2, previousItem: { value: "first", metadata: { meta: 1 } } },
        expect.anything(),
      ],
      [
        "third",
        { meta: 3, previousItem: { value: "second", metadata: { meta: 2 } } },
        expect.anything(),
      ],
    ]);
  });
});
