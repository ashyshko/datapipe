import { withFirst } from "./withFirst";

describe("withFirst", () => {
  it("should provide first element as metadata", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const handler = {
      onItem: jest.fn(),
    };

    const obj = withFirst(handler);
    obj.init?.(control as any);
    obj.onItem("first", { meta: 1 }, control as any);
    obj.onItem("second", { meta: 2 }, control as any);
    obj.onItem("third", { meta: 3 }, control as any);
    obj.onEof(control as any);
    await new Promise(process.nextTick);
    expect(handler.onItem.mock.calls).toEqual([
      [
        "second",
        { meta: 2, firstItem: { value: "first", metadata: { meta: 1 } } },
        expect.anything(),
      ],
      [
        "third",
        { meta: 3, firstItem: { value: "first", metadata: { meta: 1 } } },
        expect.anything(),
      ],
    ]);
  });
});
