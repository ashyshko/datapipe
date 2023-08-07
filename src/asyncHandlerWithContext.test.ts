import { asyncHandlerWithContext } from "./asyncHandlerWithContext";

describe("asyncHandlerWithContext", () => {
  it("should provide context from init", async () => {
    const handler = {
      init: jest.fn().mockResolvedValue("my-context"),
      onItem: jest.fn().mockResolvedValue(undefined),
    };

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
      isStopped: jest.fn(),
      setCancelFn: jest.fn(),
    };

    const res = asyncHandlerWithContext(handler);

    res.init!(control as any);
    expect(handler.init).toBeCalled();

    await new Promise(process.nextTick);
    const recvControl = handler.init.mock.lastCall![0];
    expect(recvControl.context).toBe("my-context");

    recvControl.emitItem("v", "m");
    expect(control.emitItem).toBeCalledWith("v", "m");

    recvControl.emitError(new Error("dummy error"));
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    recvControl.emitEof();
    expect(control.emitEof).toBeCalledWith();

    control.isStopped.mockReturnValueOnce("dummy return value");
    expect(recvControl.isStopped()).toBe("dummy return value");

    recvControl.setCancelFn("cancel-fn");
    expect(control.setCancelFn).toBeCalledWith("cancel-fn");

    res.onItem(123, 456, control as any);
    res.onItem(456, 789, control as any);
    expect(handler.onItem).toBeCalledWith(123, 456, recvControl);
    await new Promise(process.nextTick);
    expect(handler.onItem).toBeCalledWith(456, 789, recvControl);
  });

  it("should handle errors/eof with normalized callbacks", async () => {
    const handler = {
      init: jest.fn().mockResolvedValue("my-context"),
      onItem: jest.fn().mockResolvedValue(undefined),
      onError: jest.fn().mockResolvedValue(undefined),
      onEof: jest.fn().mockResolvedValue(undefined),
    };

    const control = {
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const res = asyncHandlerWithContext(handler);

    res.init!(control as any);
    expect(handler.init).toBeCalled();
    const recvControl = handler.init.mock.lastCall![0];

    res.onError(new Error("dummy error"), control as any);
    res.onEof(control as any);

    await new Promise(process.nextTick);
    expect(handler.onError).toBeCalledWith(
      new Error("dummy error"),
      recvControl,
    );
    expect(handler.onEof).toBeCalledWith(recvControl);
    expect(control.emitEof).not.toBeCalled();
    expect(control.emitEof).not.toBeCalled();
  });

  it("should handle errors/eof with finalize callbacks", async () => {
    const handler = {
      init: jest.fn().mockResolvedValue("my-context"),
      onItem: jest.fn().mockResolvedValue(undefined),
      finalize: jest.fn().mockResolvedValue(undefined),
    };

    const control = {
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const res = asyncHandlerWithContext(handler);

    res.init!(control as any);
    expect(handler.init).toBeCalled();
    const recvControl = handler.init.mock.lastCall![0];

    res.onError(new Error("dummy error"), control as any);

    await new Promise(process.nextTick);
    expect(handler.finalize).toBeCalledWith(
      new Error("dummy error"),
      recvControl,
    );
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    res.onEof(control as any);
    await new Promise(process.nextTick);

    expect(handler.finalize).toBeCalledWith(undefined, recvControl);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should handle errors/eof without finalize callbacks", async () => {
    const handler = {
      init: jest.fn().mockResolvedValue("my-context"),
      onItem: jest.fn().mockResolvedValue(undefined),
    };

    const control = {
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const res = asyncHandlerWithContext(handler);

    res.init!(control as any);

    res.onError(new Error("dummy error"), control as any);

    await new Promise(process.nextTick);
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    res.onEof(control as any);
    await new Promise(process.nextTick);

    expect(control.emitEof).toBeCalledWith();
  });

  it("should emit error if promise was rejected", async () => {
    const handler = {
      init: jest.fn().mockResolvedValue("my-context"),
      onItem: jest.fn().mockRejectedValue(new Error("dummy error")),
      finalize: jest.fn().mockResolvedValue(undefined),
    };

    const control = {
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const res = asyncHandlerWithContext(handler);

    res.init!(control as any);
    expect(handler.init).toBeCalled();

    res.onItem(123, 456, control as any);
    await new Promise(process.nextTick);
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
  });

  it("should throw if onError and finalize are provided", () => {
    const handle = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      finalize: jest.fn(),
    };

    // @ts-expect-error: prohibited by type deduction
    expect(() => asyncHandlerWithContext(handle)).toThrow(
      "Both onError and finalize are provided to asyncHandlerWithContext function",
    );
  });

  it("should throw if onEof and finalize are provided", () => {
    const handle = {
      init: jest.fn(),
      onItem: jest.fn(),
      onEof: jest.fn(),
      finalize: jest.fn(),
    };

    // @ts-expect-error: prohibited by type deduction
    expect(() => asyncHandlerWithContext(handle)).toThrow(
      "Both onEof and finalize are provided to asyncHandlerWithContext function",
    );
  });
});
