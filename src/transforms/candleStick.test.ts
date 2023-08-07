import { candleStick } from "./candleStick";

describe("candleStick", () => {
  it("should work with empty data", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = candleStick({});
    obj.init?.(control as any);
    obj.onEof(control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work with number data", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = candleStick<number, number>({});
    obj.init?.(control as any);
    obj.onItem(15, 1, control as any);
    obj.onItem(25, 2, control as any);
    obj.onItem(10, 3, control as any);
    obj.onItem(20, 4, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(
      {
        min: 10,
        max: 25,
        first: 15,
        last: 20,
        sum: 70,
        avg: 17.5,
        count: 4,
      },
      1,
    );
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work with custom data", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = candleStick({
      valueFn(value, metadata) {
        return (value as any).value;
      },
    });
    obj.init?.(control as any);
    obj.onItem({ value: 15 }, 1, control as any);
    obj.onItem({ value: 25 }, 2, control as any);
    obj.onItem({ value: 10 }, 3, control as any);
    obj.onItem({ value: 20 }, 4, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(
      {
        min: 10,
        max: 25,
        first: 15,
        last: 20,
        sum: 70,
        avg: 17.5,
        count: 4,
      },
      1,
    );
    expect(control.emitEof).toBeCalledWith();
  });

  it("should trigger compiler error on custom data without valueFn", () => {
    // @ts-expect-error
    candleStick<{ value: number }, {}>({});
  });
});
