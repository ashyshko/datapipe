import { rate } from "./rate";

describe("rate", () => {
  it("should work with empty list and no empty metadata", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = rate();
    obj.init?.(control as any);
    obj.onEof(control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work with empty list and empty metadata", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = rate({ onEmpty: { sendMetadata: "hello" } });
    obj.init?.(control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(0, "hello");
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work with provided items", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = rate();
    obj.init?.(control as any);
    obj.onItem(1, 1, control as any);
    obj.onItem(2, 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(2, 1);
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });
});
