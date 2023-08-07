import { withContext } from "./withContext";

describe("withContext", () => {
  it("should supply context to normalized initial handler", () => {
    const handler = {
      init: jest.fn().mockReturnValue("my-context"),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
      isStopped: jest.fn(),
      setCancelFn: jest.fn(),
    };

    const res = withContext(handler);
    res.init?.(control as any);
    expect(handler.init).toBeCalled();
    const recvControl = handler.init.mock.lastCall![0];
    expect(recvControl.context).toBe("my-context");

    recvControl.emitItem("value", "metadata");
    expect(control.emitItem).toBeCalledWith("value", "metadata");

    recvControl.emitError(new Error("dummy error"));
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    recvControl.emitEof();
    expect(control.emitEof).toBeCalledWith();

    control.isStopped.mockReturnValueOnce("dummy return value");
    expect(recvControl.isStopped()).toBe("dummy return value");

    recvControl.setCancelFn("cancel-fn");
    expect(control.setCancelFn).toBeCalledWith("cancel-fn");

    res.onItem(123, 456, { dummyControl: true } as any);
    expect(handler.onItem).toBeCalledWith(123, 456, recvControl);

    res.onError(new Error("dummy error"), { dummyControl: true } as any);
    expect(handler.onError).toBeCalledWith(
      new Error("dummy error"),
      recvControl,
    );

    res.onEof({ dummyControl: true } as any);
    expect(handler.onEof).toBeCalledWith(recvControl);
  });

  it("should supply context to initial handler with finalize", () => {
    const handler = {
      init: jest.fn().mockReturnValue("my-context"),
      onItem: jest.fn(),
      finalize: jest.fn(),
    };

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const res = withContext(handler);
    res.init?.(control as any);
    expect(handler.init).toBeCalled();
    const recvControl = handler.init.mock.lastCall![0];

    res.onItem(123, 456, control as any);
    expect(handler.onItem).toBeCalledWith(123, 456, recvControl);

    res.onError(new Error("dummy error"), control as any);
    expect(handler.finalize).toBeCalledWith(
      new Error("dummy error"),
      recvControl,
    );
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    res.onEof(control as any);
    expect(handler.finalize).toBeCalledWith(undefined, recvControl);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should supply context to initial handler without finalize", () => {
    const handler = {
      init: jest.fn().mockReturnValue("my-context"),
      onItem: jest.fn(),
    };

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const res = withContext(handler);
    res.init?.(control as any);
    expect(handler.init).toBeCalled();
    const recvControl = handler.init.mock.lastCall![0];

    res.onItem(123, 456, control as any);
    expect(handler.onItem).toBeCalledWith(123, 456, recvControl);

    res.onError(new Error("dummy error"), control as any);
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    res.onEof(control as any);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should throw if onError and finalize are provided", () => {
    const handle = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      finalize: jest.fn(),
    };

    // @ts-expect-error: prohibited by type deduction
    expect(() => withContext(handle)).toThrow(
      "Both onError and finalize are provided to withContext function",
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
    expect(() => withContext(handle)).toThrow(
      "Both onEof and finalize are provided to withContext function",
    );
  });

  it("should support control implemented via class", () => {
    class Control {
      emitItemMock = jest.fn();

      emitItem() {
        return this.emitItemMock(...arguments);
      }
    }

    const handler = {
      init: jest.fn().mockReturnValue("mock-context"),
      onItem: jest
        .fn()
        .mockImplementation((value, metadata, control) =>
          control.emitItem(value, metadata),
        ),
    };

    const control = new Control();
    (control as any).emitError = jest.fn();

    const emitItem = jest.fn();

    const res = withContext(handler);
    res.init?.(control as any);
    expect(() => res.onItem(123, 456, control as any)).not.toThrow();
    expect(handler.onItem).toBeCalledWith(123, 456, expect.anything());
    const receivedControl = handler.onItem.mock.lastCall![2];
    expect(receivedControl.emitItem).toBeDefined();
    expect((control as any).emitError).not.toBeCalled();
    expect(control.emitItemMock).toBeCalledWith(123, 456);
  });
});
