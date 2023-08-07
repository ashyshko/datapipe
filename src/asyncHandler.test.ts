import { asyncHandler } from "./asyncHandler";
import * as asyncHandlerWithContextModule from "./asyncHandlerWithContext";

describe("asyncHandler", () => {
  it("should work with normalized handlers", () => {
    const handler = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const spyAsyncHandlerWithContext = jest
      .spyOn(asyncHandlerWithContextModule, "asyncHandlerWithContext")
      .mockReturnValue("asyncHandlerWithContext-impl" as any);

    expect(asyncHandler(handler)).toBe("asyncHandlerWithContext-impl");
    const callback = spyAsyncHandlerWithContext.mock.lastCall![0];

    jest.clearAllMocks();
    callback.init("control" as any);
    expect(handler.init).toBeCalledWith("control");

    jest.clearAllMocks();
    callback.onItem(123, 456, "control" as any);
    expect(handler.onItem).toBeCalledWith(123, 456, "control");

    jest.clearAllMocks();
    callback.onError!(new Error("dummy error"), "control" as any);
    expect(handler.onError).toBeCalledWith(new Error("dummy error"), "control");

    jest.clearAllMocks();
    callback.onEof!("control" as any);
    expect(handler.onEof).toBeCalledWith("control");

    jest.restoreAllMocks();
  });

  it("should work with finalize handlers", async () => {
    const handler = {
      init: jest.fn(),
      onItem: jest.fn(),
      finalize: jest.fn().mockResolvedValue(undefined),
    };

    const control = {
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const spyAsyncHandlerWithContext = jest
      .spyOn(asyncHandlerWithContextModule, "asyncHandlerWithContext")
      .mockReturnValue("asyncHandlerWithContext-impl" as any);

    expect(asyncHandler(handler)).toBe("asyncHandlerWithContext-impl");
    const callback = spyAsyncHandlerWithContext.mock.lastCall![0];

    jest.clearAllMocks();
    callback.init(control as any);
    expect(handler.init).toBeCalledWith(control);

    jest.clearAllMocks();
    callback.onItem(123, 456, control as any);
    expect(handler.onItem).toBeCalledWith(123, 456, control);

    jest.clearAllMocks();
    callback.onError!(new Error("dummy error"), control as any);
    expect(handler.finalize).toBeCalledWith(new Error("dummy error"), control);
    await new Promise(process.nextTick);
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    jest.clearAllMocks();
    callback.onEof!(control as any);
    expect(handler.finalize).toBeCalledWith(undefined, control);
    await new Promise(process.nextTick);
    expect(control.emitEof).toBeCalledWith();

    jest.restoreAllMocks();
  });

  it("should work without finalize and init handlers", async () => {
    const handler = {
      onItem: jest.fn(),
    };

    const control = {
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const spyAsyncHandlerWithContext = jest
      .spyOn(asyncHandlerWithContextModule, "asyncHandlerWithContext")
      .mockReturnValue("asyncHandlerWithContext-impl" as any);

    expect(asyncHandler(handler)).toBe("asyncHandlerWithContext-impl");
    const callback = spyAsyncHandlerWithContext.mock.lastCall![0];

    jest.clearAllMocks();
    callback.init(control as any);

    jest.clearAllMocks();
    callback.onItem(123, 456, control as any);
    expect(handler.onItem).toBeCalledWith(123, 456, control);

    jest.clearAllMocks();
    callback.onError!(new Error("dummy error"), control as any);
    await new Promise(process.nextTick);
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    jest.clearAllMocks();
    callback.onEof!(control as any);
    await new Promise(process.nextTick);
    expect(control.emitEof).toBeCalledWith();

    jest.restoreAllMocks();
  });
});
