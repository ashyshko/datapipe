import { skip } from "./skip";

describe("skip", () => {
  it("should skip first N items", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = skip(1);
    obj.init?.(control as any);
    obj.onItem(123, 234, control as any);
    obj.onItem(234, 345, control as any);
    obj.onItem(345, 456, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      [234, 345],
      [345, 456],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });
});
