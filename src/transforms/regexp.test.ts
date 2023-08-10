import { regexp } from "./regexp";

describe("regexp", () => {
  it("should filter by condition", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = regexp(/hello-(\d+)$/);
    obj.init?.(control as any);
    obj.onItem("hello", 1, control as any);
    obj.onItem("hello-123", 2, control as any);
    obj.onItem("world", 3, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([[["hello-123", "123"], 2]]);
    expect(control.emitEof).toBeCalledWith();
  });
});
