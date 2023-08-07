import { sample } from "./sample";

describe("Sample", () => {
  it("should return first value", () => {
    const obj = sample("first");

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);
    obj.onItem(10, "1", control as any);
    obj.onItem(20, "2", control as any);
    obj.onItem(15, "3", control as any);
    obj.onItem(30, "4", control as any);
    obj.onItem(15, "5", control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(10, "1");
    expect(control.emitEof).toBeCalled();
  });

  it("should return last value", () => {
    const obj = sample("last");

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);
    obj.onItem(10, "1", control as any);
    obj.onItem(20, "2", control as any);
    obj.onItem(15, "3", control as any);
    obj.onItem(30, "4", control as any);
    obj.onItem(15, "5", control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(15, "5");
    expect(control.emitEof).toBeCalled();
  });

  it("should return random value", () => {
    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.3) // compared for "2" (<0.5) -> selected
      .mockReturnValueOnce(0.35); // compared for "3" (>0.333) -> ignored

    const obj = sample("random");

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);
    obj.onItem(10, "1", control as any);
    obj.onItem(20, "2", control as any);
    obj.onItem(15, "3", control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(20, "2");
    expect(control.emitEof).toBeCalled();

    jest.spyOn(Math, "random").mockRestore();
  });

  it("should return min value for group", () => {
    const obj = sample({
      type: "min",
      valueFn: (v) => v as any,
    });

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);
    obj.onItem(30, "1", control as any);
    obj.onItem(20, "2", control as any);
    obj.onItem(15, "3", control as any);
    obj.onItem(30, "4", control as any);
    obj.onItem(20, "5", control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(15, "3");
    expect(control.emitEof).toBeCalled();
  });

  it("should return max value for group", () => {
    const obj = sample({
      type: "max",
      valueFn: (v) => v as any,
    });

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);
    obj.onItem(15, "1", control as any);
    obj.onItem(20, "2", control as any);
    obj.onItem(15, "3", control as any);
    obj.onItem(30, "4", control as any);
    obj.onItem(20, "5", control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(30, "4");
    expect(control.emitEof).toBeCalled();
  });

  it("shouldn't report on error", () => {
    const obj = sample({
      type: "max",
      valueFn: (v) => v as any,
    });

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);
    obj.onItem(15, "1", control as any);
    obj.onError(new Error("dummy error"), control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
    expect(control.emitEof).not.toBeCalled();
  });
});
