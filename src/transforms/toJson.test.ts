import { toJson } from "./toJson";

describe("toJson", () => {
  it("should work with no data provided", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toJson();
    obj.init?.(control as any);
    obj.onEof(control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalled();
  });

  it("should work with provided data", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toJson();
    obj.init?.(control as any);
    obj.onItem({ a: true }, 1, control as any);
    obj.onItem({ b: "hello" }, 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ['[{"a":true}', 1],
      [', {"b":"hello"}', 2],
      ["]", 2],
    ]);
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalled();
  });
});
