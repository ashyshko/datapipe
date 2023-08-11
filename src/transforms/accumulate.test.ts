import { accumulate } from "./accumulate";

describe("accumulate", () => {
  it("should use provided function return value as emited value", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = accumulate((prev, cur: number) => prev + cur * cur, 10);
    obj.init?.(control as any);
    obj.onItem(1, "m1", control as any);
    obj.onItem(2, "m2", control as any);
    obj.onEof(control as any);

    expect(control.emitItem.mock.calls).toEqual([
      [11, "m1"],
      [15, "m2"],
    ]);
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });
});
