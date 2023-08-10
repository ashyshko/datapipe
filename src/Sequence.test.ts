import { Sequence } from "./Sequence";

describe("Sequence", () => {
  it("should work without items emited", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };
    const obj = new Sequence(control as any);
    obj.onEof();
    await new Promise(process.nextTick);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work with single handler", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];
    expect(handler1.onItem).toBeCalledWith(123, 234, control1);
    expect(handler1.onError).not.toBeCalled();
    expect(handler1.onEof).not.toBeCalled();
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();

    jest.clearAllMocks();
    obj.onItem(345, 456, handler1);
    expect(handler1.init).not.toBeCalled();
    expect(handler1.onItem).toBeCalledWith(345, 456, control1);
    expect(handler1.onError).not.toBeCalled();
    expect(handler1.onEof).not.toBeCalled();
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();

    jest.clearAllMocks();
    obj.onEof();
    expect(handler1.init).not.toBeCalled();
    expect(handler1.onItem).not.toBeCalled();
    expect(handler1.onError).not.toBeCalled();
    expect(handler1.onEof).toBeCalledWith(control1);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();

    await new Promise(process.nextTick);

    jest.clearAllMocks();
    control1.emitItem("hello", "world");
    expect(control.emitItem).toBeCalledWith("hello", "world");
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();

    jest.clearAllMocks();
    control1.emitEof();
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work with two handlers", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler2 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];

    await new Promise(process.nextTick);

    jest.clearAllMocks();
    obj.onItem(234, 345, handler2);
    expect(handler1.onEof).toBeCalledWith(control1);
    expect(handler2.init).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();

    jest.clearAllMocks();
    control1.emitEof();
    expect(handler2.init).toBeCalledTimes(1);
    const control2 = handler2.init.mock.lastCall![0];
    expect(handler2.onItem).toBeCalledWith(234, 345, control2);
    expect(handler2.onEof).not.toBeCalled();

    await new Promise(process.nextTick);

    jest.clearAllMocks();
    obj.onEof();
    expect(handler2.onEof).toBeCalledWith(control2);
    expect(control.emitEof).not.toBeCalled();

    jest.clearAllMocks();
    control2.emitEof();
    expect(control.emitEof).toBeCalled();
  });

  it("should work with three handlers", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler2 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler3 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    obj.onItem(234, 345, handler2);
    obj.onItem(345, 456, handler3);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];

    await new Promise(process.nextTick);

    jest.clearAllMocks();
    control1.emitEof();
    expect(handler2.init).toBeCalledTimes(1);
    const control2 = handler2.init.mock.lastCall![0];
    expect(handler2.onItem).toBeCalledWith(234, 345, control2);
    expect(handler2.onEof).toBeCalledWith(control2);
    expect(handler3.init).not.toBeCalled();

    await new Promise(process.nextTick);
    // rest is the same behavior as test with 2 handlers
  });

  it("should emit error without handlers", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };
    const obj = new Sequence(control as any);
    obj.onError(new Error("dummy error"));
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
  });

  it("should send error to handler", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };
    const obj = new Sequence(control as any);
    const handler = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.onItem(123, 234, handler);

    obj.onError(new Error("dummy error"));
    expect(control.emitError).not.toBeCalled();
    expect(handler.onError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
  });

  it("should receive error from handler", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };
    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    const handler2 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.onItem(123, 234, handler1);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];

    await new Promise(process.nextTick);

    control1.emitError(new Error("dummy error"));
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
  });

  it("should work with two handlers and delay", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler2 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];
    control1.emitEof();

    await new Promise(process.nextTick);
    expect(control.emitEof).not.toBeCalled();

    jest.clearAllMocks();
    obj.onItem(234, 345, handler2);
    expect(handler1.onEof).not.toBeCalled();
    expect(handler2.init).toBeCalled();
    const control2 = handler2.init.mock.lastCall![0];
    expect(handler2.onItem).toBeCalledWith(234, 345, control2);
  });

  it("should work with multiple items for second handler", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler2 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    obj.onItem(234, 345, handler2);
    obj.onItem(345, 456, handler2);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];

    await new Promise(process.nextTick);
    control1.emitEof();
    expect(handler2.init).toBeCalled();
    const control2 = handler2.init.mock.lastCall![0];
    expect(handler2.onItem.mock.calls).toEqual([
      [234, 345, control2],
      [345, 456, control2],
    ]);
  });

  it("should ignore notifications from previous handlers", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler2 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    obj.onItem(234, 345, handler2);
    obj.onItem(345, 456, handler2);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];

    await new Promise(process.nextTick);
    control1.emitError(new Error("real error"));

    jest.clearAllMocks();
    control1.emitItem("not-an-item", true);
    control1.emitError(new Error("dummy error"));
    control1.emitEof();
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();
  });

  it("should ignore items/errors/eof after error", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];

    await new Promise(process.nextTick);
    control1.emitError(new Error("dummy error"));
    expect(control.emitError).toBeCalled();

    jest.clearAllMocks();
    obj.onItem(234, 345, handler1);
    obj.onEof();
    obj.onError(new Error("error"));
    expect(handler1.onItem).not.toBeCalled();
    expect(handler1.onError).not.toBeCalled();
    expect(handler1.onEof).not.toBeCalled();
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();
  });

  it("should ignore items/errors/eof after input error", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall![0];
    obj.onError(new Error("dummy error"));

    await new Promise(process.nextTick);

    jest.clearAllMocks();
    obj.onItem(123, 234, handler1);
    obj.onError(new Error("second error"));
    obj.onEof();
    expect(handler1.onError).not.toBeCalled();
    expect(handler1.onEof).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();

    jest.clearAllMocks();
    control1.emitEof();
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
    expect(control.emitEof).not.toBeCalled();
  });

  it("should work with handler without init", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = new Sequence(control as any);
    const handler1 = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.onItem(123, 234, handler1);
    expect(handler1.onItem).toBeCalledWith(123, 234, expect.anything());
  });
});
