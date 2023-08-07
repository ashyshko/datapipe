import { filterMap } from "./filterMap";

describe("filterMap", () => {
  it("should filter and map", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const callback = jest
      .fn()
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ value: "hello", metadata: "world" });

    const obj = filterMap(callback);
    obj.onItem(123, 234, control as any);
    obj.onItem(345, 456, control as any);
    obj.onEof(control as any);

    expect(callback.mock.calls).toEqual([
      [123, 234],
      [345, 456],
    ]);
    expect(control.emitItem).toBeCalledWith("hello", "world");
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should emit error", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const callback = jest.fn();

    const obj = filterMap(callback);
    obj.onError(new Error("dummy error"), control as any);

    expect(callback).not.toBeCalled();
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
    expect(control.emitEof).not.toBeCalled();
  });

  it("should emit error from callback", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const callback = jest.fn().mockImplementation(() => {
      throw new Error("dummy error");
    });

    const obj = filterMap(callback);
    obj.onItem(123, 234, control as any);

    expect(callback).toBeCalledWith(123, 234);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
    expect(control.emitEof).not.toBeCalled();
  });
});
