import { limit } from "./limit";

describe("limit", () => {
  it("should work without items receiver", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = limit(2);
    obj.init?.(control as any);
    obj.onEof(control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work without limit reached", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = limit(2);
    obj.init?.(control as any);
    obj.onItem(1, 1, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([[1, 1]]);
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work with limit reached", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = limit(2);
    obj.init?.(control as any);
    obj.onItem(1, 1, control as any);
    obj.onItem(2, 2, control as any);
    obj.onItem(3, 3, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      [1, 1],
      [2, 2],
    ]);
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should check validity of maxItems", () => {
    expect(() => limit(0)).toThrow("incorrect maxItems value");
  });
});
