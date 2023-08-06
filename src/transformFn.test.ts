import { DataPipeBase } from "./DataPipeBase";
import { transform } from "./transformFn";

describe("transform", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  it("should trigger provided callbacks", () => {
    const props = {
      processItem: jest.fn(),
      processError: jest.fn(),
      processEof: jest.fn(),
    };
    const obj = transform<string, number, number, string>(dummyDataPipe, props);
    obj._start();
    obj.onItem("hello", 123);
    expect(props.processItem).toBeCalledWith("hello", 123, expect.anything());
    obj.onError(new Error("dummy error"));
    expect(props.processError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
    obj.onEof();
    expect(props.processEof).toBeCalledWith(expect.anything());
  });

  it("should provide context for actions", () => {
    const props = {
      processItem: jest.fn(),
      processError: jest.fn(),
      processEof: jest.fn(),
    };
    const obj = transform<string, number, number, string>(dummyDataPipe, props);

    // @ts-expect-error emitItem is private
    const emitItemSpy = jest.spyOn(obj, "emitItem");

    // @ts-expect-error emitError is private
    const emitErrorSpy = jest.spyOn(obj, "emitError");

    // @ts-expect-error emitEof is private
    const emitEofSpy = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onItem("hello", 123);
    const ctx = props.processItem.mock.calls[0][2];
    ctx.emitItem(123, "hello");
    expect(emitItemSpy.mock.calls).toEqual([[123, "hello"]]);
    ctx.emitError(new Error("dummy error"));
    expect(emitErrorSpy.mock.calls).toEqual([[new Error("dummy error")]]);
    ctx.emitEof();
    expect(emitEofSpy).toBeCalledTimes(1);
  });

  it("should work with default error handler", () => {
    const props = {
      processItem: jest.fn(),
    };
    const obj = transform<string, number, number, string>(dummyDataPipe, props);

    // @ts-expect-error emitError is private
    const emitErrorSpy = jest.spyOn(obj, "emitError");

    obj._start();
    obj.onError(new Error("dummy error"));
    expect(emitErrorSpy.mock.calls).toEqual([[new Error("dummy error")]]);
  });

  it("should work with default eof handler", () => {
    const props = {
      processItem: jest.fn(),
    };
    const obj = transform<string, number, number, string>(dummyDataPipe, props);

    // @ts-expect-error emitEof is private
    const emitEofSpy = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onEof();
    expect(emitEofSpy).toBeCalledTimes(1);
  });

  it("should provide isStopped status", () => {
    const props = {
      processItem: jest.fn(),
      processError: jest.fn(),
      processEof: jest.fn(),
    };

    const obj = transform<string, number, number, string>(dummyDataPipe, props);

    obj._start();
    obj.onItem("hello", 123);
    const ctx = props.processItem.mock.calls[0][2];
    expect(ctx.isStopped()).toBeFalsy();
    obj._cancel();
    expect(ctx.isStopped()).toBeTruthy();
  });

  it("should provide isStopped status", () => {
    const props = {
      processItem: jest.fn(),
    };

    const cancelFn = jest.fn();
    props.processItem.mockImplementationOnce((value, metadata, ctx) => {
      ctx.setCancelFn(cancelFn);
    });

    const obj = transform<string, number, number, string>(dummyDataPipe, props);

    obj._start();
    obj.onItem("hello", 123);
    obj.onError(new Error("dummy error"));
    expect(cancelFn).toBeCalled();
  });

  it("should trigger onStarted callback", () => {
    const props = {
      onStarted: jest.fn(),
      processItem: jest.fn(),
      processError: jest.fn(),
      processEof: jest.fn(),
    };

    const obj = transform<string, number, number, string>(dummyDataPipe, props);

    obj._start();
    expect(props.onStarted).toBeCalled();
  });

  it("should call finalize callback", () => {
    const props = {
      processItem: jest.fn(),
      finalize: jest.fn(),
    };

    const obj = transform<string, number, number, string>(dummyDataPipe, props);

    obj._start();
    obj.onEof();
    expect(props.finalize).toBeCalled();
  });
});
