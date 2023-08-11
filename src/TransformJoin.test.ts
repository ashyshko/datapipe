import { DataPipe } from "./DataPipe";
import { Transform, TransformChain } from "./Transform";
import { TransformJoin, join } from "./TransformJoin";
import * as SenderModule from "./Sender";

describe("TransformJoin", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const dummyDataPipe = {
    _registerTransform: () => undefined,
  } as any as DataPipe;

  it("should work without handlers provided", async () => {
    const control = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = new TransformJoin(dummyDataPipe, []);
    obj.chain(control);
    await obj.join();
    expect(control.onItem).not.toBeCalled();
    expect(control.onError).not.toBeCalled();
    expect(control.onEof).toBeCalledWith(expect.anything());
  });

  it("should work with single handler", async () => {
    const control = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
    };

    const obj = new TransformJoin(dummyDataPipe, [
      new Transform(dummyDataPipe, handler1),
    ]);
    obj.chain(control);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall?.[0];
    control1.emitItem(1, 2);
    control1.emitEof();
    await obj.join();
    expect(control.onItem.mock.calls).toEqual([
      [1, { originalMetadata: 2, sourceIndex: 0 }, expect.anything()],
    ]);
    expect(control.onError).not.toBeCalled();
    expect(control.onEof).toBeCalledWith(expect.anything());
  });

  it("should work with multiple handlers", async () => {
    const control = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
    };

    const handler2 = {
      init: jest.fn(),
      onItem: jest.fn(),
    };

    const obj = new TransformJoin(dummyDataPipe, [
      new Transform(dummyDataPipe, handler1),
      new Transform(dummyDataPipe, handler2),
    ]);
    obj.chain(control);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall?.[0];
    expect(handler2.init).toBeCalledTimes(1);
    const control2 = handler2.init.mock.lastCall?.[0];
    control1.emitItem(1, 2);
    control1.emitEof();
    expect(control.onEof).not.toBeCalled();
    control2.emitItem(3, 4);
    control2.emitEof();
    await obj.join();
    expect(control.onItem.mock.calls).toEqual([
      [1, { originalMetadata: 2, sourceIndex: 0 }, expect.anything()],
      [3, { originalMetadata: 4, sourceIndex: 1 }, expect.anything()],
    ]);
    expect(control.onError).not.toBeCalled();
    expect(control.onEof).toBeCalledWith(expect.anything());
  });

  it("should stop on error from any handler", async () => {
    const control = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const handler1 = {
      init: jest.fn(),
      onItem: jest.fn(),
    };

    const handler2 = {
      init: jest.fn(),
      onItem: jest.fn(),
    };

    const obj = new TransformJoin(dummyDataPipe, [
      new Transform(dummyDataPipe, handler1),
      new Transform(dummyDataPipe, handler2),
    ]);
    obj.chain(control);
    expect(handler1.init).toBeCalledTimes(1);
    const control1 = handler1.init.mock.lastCall?.[0];
    expect(handler2.init).toBeCalledTimes(1);
    const control2 = handler2.init.mock.lastCall?.[0];
    control1.emitError(new Error("dummy error"));
    control2.emitItem(3, 4);
    control2.emitEof();
    await expect(() => obj.join()).rejects.toThrow("dummy error");
    expect(control.onItem).not.toBeCalled();
    expect(control.onError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
    expect(control.onEof).not.toBeCalled();
  });

  it("should throw exception on input item/error/eof", () => {
    const obj = new TransformJoin(dummyDataPipe, []);
    expect(() => obj.onItem(1 as never, 2 as never)).toThrow(
      "onItem called for TransformJoin",
    );
    expect(() => obj.onError(new Error("dummy error"))).toThrow(
      "onError called for TransformJoin",
    );
    expect(() => obj.onEof()).toThrow("onEof called for TransformJoin");
  });

  it("should accept transforms for chaining", async () => {
    const control = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn().mockImplementation((v) => v.emitEof()),
    };

    const recv = new Transform(dummyDataPipe, control, "dummy-recv");
    const obj = new TransformJoin(dummyDataPipe, []);
    const res = obj.chain(recv);
    await res.join();
    expect(control.onEof).toBeCalledWith(expect.anything());
  });

  it("should provide log func on Sender ctor", () => {
    const sender = { emitEof: jest.fn() };
    const senderMock = jest
      .spyOn(SenderModule, "Sender")
      .mockImplementationOnce(() => sender as any);

    const obj = new TransformJoin(dummyDataPipe, [], null);
    expect(senderMock).toBeCalledTimes(1);
    const logFn = senderMock.mock.lastCall![0];
    expect(logFn).toBeInstanceOf(Function);

    const logSpy = jest.spyOn(console, "log").mockReturnValue(undefined);

    logFn!("test");
    expect(logSpy).toBeCalledWith("TransformJoin unnamed: test");

    jest.restoreAllMocks();
  });
});

describe("join", () => {
  const dummyDataPipe = {
    _registerTransform: () => undefined,
  } as any as DataPipe;

  beforeEach(() => {
    jest.spyOn(console, "log").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should work", async () => {
    const fromHandler = {
      onItem: jest.fn(),
      onEof: jest.fn(),
    };
    const toHandler = {
      init: jest.fn(),
      onItem: jest.fn(),
      onEof: jest.fn(),
    };
    const recv = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    const from = new Transform(dummyDataPipe, fromHandler);
    const to = new Transform(dummyDataPipe, toHandler);
    const obj = join(from, [to]);
    obj.chain(recv);
    await new Promise(process.nextTick);
    from.onItem(123, 234);
    from.onEof();
    expect(fromHandler.onItem).toBeCalledWith(123, 234, expect.anything());
    expect(fromHandler.onEof).toBeCalledWith(expect.anything());
    expect(toHandler.init).toBeCalledTimes(1);
    const toControl = toHandler.init.mock.lastCall![0];
    toControl.emitItem(234, 345);
    toControl.emitEof();
    expect(recv.onItem).toBeCalledWith(
      234,
      {
        originalMetadata: 345,
        sourceIndex: 0,
      },
      expect.anything(),
    );
    expect(recv.onEof).toBeCalledWith(expect.anything());
    await obj.join();
  });
});
