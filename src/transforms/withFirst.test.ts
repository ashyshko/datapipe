import { withFirst } from "./withFirst";

describe("withFirst", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should provide first element as metadata", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = withFirst();
    obj.init?.(control as any);
    obj.onItem("first", { meta: 1 }, control as any);
    obj.onItem("second", { meta: 2 }, control as any);
    obj.onItem("third", { meta: 3 }, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      [
        { current: "second", first: { value: "first", metadata: { meta: 1 } } },
        { meta: 2 },
      ],
      [
        { current: "third", first: { value: "first", metadata: { meta: 1 } } },
        { meta: 3 },
      ],
    ]);
  });
});
