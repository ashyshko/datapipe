import { DataPipeBase } from "./DataPipeBase";
import { ITransform } from "./ITransform";
import { Canceled, Transform } from "./Transform";
import * as chainModule from "./Chain";

class TransformImpl extends Transform<string, number, number, string> {
  public onItem = jest
    .fn<void, [string, number]>()
    .mockImplementation((value, metadata) => super.onItem(value, metadata));
  public onError = jest
    .fn<void, [Error]>()
    .mockImplementation((error) => super.onError(error));
  public onEof = jest.fn<void, []>().mockImplementation(() => super.onEof());

  public _start = jest.fn<void, []>().mockImplementation(() => super._start());
  public _cancel = jest
    .fn<void, []>()
    .mockImplementation(() => super._cancel());
  public join = jest
    .fn<Promise<void>, []>()
    .mockImplementation(() => super.join());

  public chain = jest
    .fn<
      chainModule.Chain<any, any, any, any, any, any>,
      [ITransform<any, any, any, any>]
    >()
    .mockImplementation((recv) => super.chain(recv));

  public processItem = jest.fn<void | Promise<void>, [string, number]>();
  public processError = jest
    .fn<void | Promise<void>, [Error]>()
    .mockImplementation((e) => super.processError(e));
  public processEof = jest
    .fn<void | Promise<void>, []>()
    .mockImplementation(() => super.processEof());

  public emitItem = jest
    .fn<void, [number, string]>()
    .mockImplementation((value, metadata) => super.emitItem(value, metadata));
  public emitError = jest
    .fn<void, [Error]>()
    .mockImplementation((e) => super.emitError(e));
  public emitEof = jest
    .fn<void, []>()
    .mockImplementation(() => super.emitEof());

  public finalize = jest
    .fn<void, [Error | undefined]>()
    .mockImplementation((e) => super.finalize(e));

  public setCancelFn = jest
    .fn<void, [() => void]>()
    .mockImplementation((fn) => super.setCancelFn(fn));
}

describe("Transform", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  let chainMock: jest.Mock | undefined;

  beforeEach(() => {
    chainMock = jest
      .spyOn(chainModule, "Chain")
      .mockImplementation(() => ({}) as any) as any;
  });

  afterEach(() => {
    chainMock?.mockRestore();
  });

  it("should handle items", () => {
    const obj = new TransformImpl(dummyDataPipe);
    obj._start();
    obj.onItem("value", 123);
    obj.onItem("v2", 456);

    expect(obj.processItem.mock.calls).toEqual([
      ["value", 123],
      ["v2", 456],
    ]);

    obj.onEof();
    expect(obj.processEof).toBeCalledTimes(1);
    expect(obj.emitEof).toBeCalledTimes(1); // by default, processEof should trigger emitEof
  });

  it("should handle error", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj._start();
    obj.onError(new Error("dummy error"));

    expect(obj.processError.mock.calls).toEqual([[new Error("dummy error")]]);
    expect(obj.emitError).toBeCalledTimes(1); // by default, processError should trigger emitError
  });

  it("should throw exception in case of item/error/eof prior _start", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    expect(() => obj.onItem("value", 123)).toThrow(
      "The method dummy.onItem() cannot be called prior to calling DataPipe.start().",
    );
    expect(() => obj.onError(new Error("dummy error"))).toThrow(
      "The method dummy.onError() cannot be called prior to calling DataPipe.start().",
    );
    expect(() => obj.onEof()).toThrow(
      "The method dummy.onEof() cannot be called prior to calling DataPipe.start().",
    );
  });

  it("should throw exception in case of item/error/eof after eof", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj._start();
    obj.emitEof();
    expect(() => obj.onItem("value", 123)).toThrow(
      "The method dummy.onItem() cannot be called after eof.",
    );
    expect(() => obj.onError(new Error("dummy error"))).toThrow(
      "The method dummy.onError() cannot be called after eof.",
    );
    expect(() => obj.onEof()).toThrow(
      "The method dummy.onEof() cannot be called after eof.",
    );
  });

  it("should throw exception in case of item after error", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj._start();
    obj.emitError(new Error("failed"));
    expect(() => obj.onItem("value", 123)).toThrow(
      "dummy.onItem() has been called in failed state",
    );
  });

  it("should not throw exception in case of error/eof after error", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj._start();
    obj.emitError(new Error("failed"));
    expect(() => obj.onError(new Error("dummy error"))).not.toThrow();
    expect(() => obj.onEof()).not.toThrow();
  });

  it("should automatically register in DataPipe", () => {
    const dataPipe = {
      _registerTransform: jest.fn(),
    };

    const obj = new TransformImpl(dataPipe as unknown as DataPipeBase, "dummy");
    expect(dataPipe._registerTransform).toBeCalledWith(obj);
  });

  it("should work with no data piped", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.emitEof();
    await obj.join();
    expect(receiver.onItem).not.toBeCalled();
    expect(receiver.onError).not.toBeCalled();
    expect(receiver.onEof).toBeCalled();
  });

  it("should work with data sent", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.emitItem(10, "hello");
    obj.emitItem(20, "world");
    obj.emitEof();
    await obj.join();
    expect(receiver.onItem.mock.calls).toEqual([
      [10, "hello"],
      [20, "world"],
    ]);
    expect(receiver.onError).not.toBeCalled();
    expect(receiver.onEof).toBeCalled();
  });

  it("should work with error triggered", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.emitError(new Error("failed"));
    expect(receiver.onItem).not.toBeCalled();
    expect(receiver.onError).toBeCalledWith(new Error("failed"));
    expect(receiver.onEof).not.toBeCalled();
    await expect(obj.join()).rejects.toThrow("failed");
  });

  it("should trigger error if canceled", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj._cancel();
    await expect(obj.join()).rejects.toThrow("Canceled");
    expect(receiver.onItem).not.toBeCalled();
    expect(receiver.onError).toBeCalledWith(new Canceled());
    expect(receiver.onEof).not.toBeCalled();
  });

  it("should throw error if _start called twice", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj._start();
    expect(() => obj._start()).toThrow("dummy._start() has been called twice.");
  });

  it("should throw error if _cancel is called without _start", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    expect(() => obj._cancel()).toThrow(
      "dummy.cancel() cannot be called prior to calling DataPipe.start().",
    );
  });

  it("should throw error if chain is called after _start", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj._start();
    expect(() =>
      obj.chain(
        receiver as unknown as Transform<number, string, unknown, unknown>,
      ),
    ).toThrow(
      "dummy.chain() cannot be added after invoking DataPipe.start(). It could be done only in 'init' state.",
    );
  });

  it("should throw error if emitItem/emitError/emitEof is called before _start", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    expect(() => obj.emitItem(10, "hello")).toThrow(
      "dummy.emitItem() cannot be called before the DataPipe.start() method.",
    );
    expect(() => obj.emitError(new Error("failed"))).toThrow(
      "dummy.emitError() cannot be called before the DataPipe.start() method.",
    );
    expect(() => obj.emitEof()).toThrow(
      "dummy.emitEof() cannot be called before the DataPipe.start() method.",
    );
  });

  it("should throw error if emitItem/emitError/emitEof is called after emitEof", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj._start();
    obj.emitEof();
    expect(() => obj.emitItem(10, "hello")).toThrow(
      "dummy.emitItem() cannot be called after eof.",
    );
    expect(() => obj.emitError(new Error("failed"))).toThrow(
      "dummy.emitError() cannot be called after eof.",
    );
    expect(() => obj.emitEof()).toThrow("dummy.emitError() called twice.");
  });

  it("should ignore emitItem/emitError/emitEof after emitError", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.emitError(new Error("failed"));
    obj.emitItem(10, "hello");
    obj.emitError(new Error("second error"));
    obj.emitEof();
    await expect(() => obj.join()).rejects.toThrow("failed");
    expect(receiver.onItem).not.toBeCalled();
    expect(receiver.onError.mock.calls).toEqual([[new Error("failed")]]);
    expect(receiver.onEof).not.toBeCalled();
  });

  it("should throw error if join is called before _start", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    await expect(() => obj.join()).rejects.toThrow(
      "The method dummy.join() cannot be called prior to calling DataPipe.start().",
    );
  });

  it("should wait for eof on join", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj._start();
    const promise = obj.join();
    obj.emitEof();
    await promise;
  });

  it("should wait for error on join", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj._start();
    const promise = obj.join();
    obj.emitError(new Error("failed"));
    await expect(promise).rejects.toThrow("failed");
  });

  it("should do nothing if canceled after eof", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.emitEof();
    obj._cancel();
    await obj.join();
    expect(receiver.onEof).toBeCalled();
    expect(receiver.onError).not.toBeCalled();
  });

  it("should do nothing if canceled after error", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.emitError(new Error("dummy error"));
    obj._cancel();
    await expect(() => obj.join()).rejects.toThrow("dummy error");
    expect(receiver.onEof).not.toBeCalled();
    expect(receiver.onError.mock.calls).toEqual([[new Error("dummy error")]]);
  });

  it("should call cancelFn on error", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    const cancelFn = jest.fn();
    obj.setCancelFn(cancelFn);
    obj._start();
    obj.emitError(new Error("dummy error"));
    await expect(() => obj.join()).rejects.toThrow("dummy error");
    expect(cancelFn).toBeCalled();
  });

  it("should handle exceptions in processItem/processError/processEof", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.processItem.mockImplementationOnce((value, metadata) => {
      throw new Error("dummy error");
    });
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    expect(() => obj.onItem("ignored", 1)).toThrow("dummy error");
    await expect(() => obj.join()).rejects.toThrow("dummy error");
    expect(receiver.onError).toBeCalledWith(new Error("dummy error"));
  });

  it("should handle exceptions in async processItem/processError/processEof", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.processItem.mockRejectedValueOnce(new Error("dummy error"));
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.onItem("ignored", 1);
    await expect(() => obj.join()).rejects.toThrow("dummy error");
    expect(receiver.onError).toBeCalledWith(new Error("dummy error"));
  });

  it("shouldn't raise unhandled promise rejection on async onItem failure", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.processItem
      .mockImplementationOnce(() => new Promise(process.nextTick))
      .mockImplementationOnce(() => {
        throw new Error("dummy error");
      });
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.onItem("item", 1);
    obj.onItem("item", 2);
    await expect(() => obj.join()).rejects.toThrow("dummy error");
    expect(receiver.onError).toBeCalledWith(new Error("dummy error"));
  });

  it("should wait for previous task completion", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    obj.processItem
      .mockImplementationOnce(async (value, metadata) => {
        await new Promise(process.nextTick);
        obj.emitItem(metadata, "processed");
      })
      .mockImplementationOnce((value, metadata) => {
        expect(receiver.onItem).toBeCalledWith(1, "processed");
        obj.emitItem(metadata, "processed");
      });
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.onItem("ignored", 1);
    obj.onItem("ignored", 2);
    obj.onEof();
    await obj.join();
    expect(receiver.onItem.mock.calls).toEqual([
      [1, "processed"],
      [2, "processed"],
    ]);
    expect(receiver.onEof).toBeCalled();
  });

  it("should wait for async finalize on eof", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj.finalize.mockImplementation(async () => {
      await new Promise(process.nextTick);
      obj.emitItem(42, "eof-item");
    });
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.onEof();
    await obj.join();
    expect(receiver.onItem).toBeCalledWith(42, "eof-item");
    expect(receiver.onEof).toBeCalled();
  });

  it("should wait for async finalize on error", async () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    obj.finalize.mockImplementation(async () => {
      await new Promise(process.nextTick);
      obj.emitItem(42, "eof-item");
    });
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    obj._start();
    obj.onError(new Error("dummy error"));
    await expect(() => obj.join()).rejects.toThrow("dummy error");
    expect(receiver.onItem).toBeCalledWith(42, "eof-item");
    expect(receiver.onError).toBeCalledWith(new Error("dummy error"));
  });

  it("should use Chain object for chaining", () => {
    const obj = new TransformImpl(dummyDataPipe, "dummy");
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    chainMock!.mockImplementationOnce(() => ({ "mocked-chain": true }));
    const res = obj.chain(
      receiver as unknown as Transform<number, string, unknown, unknown>,
    );
    expect(res).toEqual({ "mocked-chain": true });
  });
});
