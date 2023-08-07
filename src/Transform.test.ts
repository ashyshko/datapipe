import { DataPipe } from "./DataPipe";
import { Transform } from "./Transform";
import * as SenderModule from "./Sender";
import * as groupModule from "./group";

describe("Transform", () => {
  const dummyDataPipe = {
    _registerTransform: () => undefined,
  } as any as DataPipe;

  it("should register itself in DataPipe", () => {
    const dataPipe = {
      _registerTransform: jest.fn(),
    };

    const obj = new Transform(dataPipe as any, {} as any, "dummy");
    expect(obj.name).toBe("dummy");
    expect(obj.dataPipe).toBe(dataPipe);
    expect(dataPipe._registerTransform).toBeCalledWith(obj);
  });

  it("should init handler on ctor", () => {
    const sender = { mockedSender: true };
    jest
      .spyOn(SenderModule, "Sender")
      .mockImplementationOnce(() => sender as any);

    const handler = {
      init: jest.fn(),
      onItem: jest.fn(),
    };

    const obj = new Transform(dummyDataPipe, handler);
    expect(handler.init).toBeCalledWith(sender);

    jest.restoreAllMocks();
  });

  it("should provide items/errors/eof to handler", () => {
    const sender = { mockedSender: true };
    jest
      .spyOn(SenderModule, "Sender")
      .mockImplementationOnce(() => sender as any);

    const handler = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = new Transform(dummyDataPipe, handler);

    obj.onItem(123, 456);
    expect(handler.onItem).toBeCalledWith(123, 456, sender);

    obj.onError(new Error("dummy error"));
    expect(handler.onError).toBeCalledWith(new Error("dummy error"), sender);

    obj.onEof();
    expect(handler.onEof).toBeCalledWith(sender);

    jest.restoreAllMocks();
  });

  it("should use sender.join() for join", async () => {
    const sender = {
      join: jest.fn().mockRejectedValue(new Error("dummy error")),
      mockedSender: true,
    };
    jest
      .spyOn(SenderModule, "Sender")
      .mockImplementationOnce(() => sender as any);

    const handler = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = new Transform(dummyDataPipe, handler);
    await expect(() => obj.join()).rejects.toThrow("dummy error");
    expect(sender.join).toBeCalledWith();

    jest.restoreAllMocks();
  });

  it("should chain with Transform", async () => {
    const handler1 = {
      onItem: jest
        .fn()
        .mockImplementation((value, metadata, control) =>
          control.emitItem(value, metadata),
        ),
      onEof: jest.fn().mockImplementation((control) => control.emitEof()),
    };
    const obj1 = new Transform(dummyDataPipe, handler1);
    const handler2 = {
      onItem: jest
        .fn()
        .mockImplementation((value, metadata, control) =>
          control.emitItem(value, metadata),
        ),
      onEof: jest.fn().mockImplementation((control) => control.emitEof()),
    };
    const obj2 = new Transform(dummyDataPipe, handler2);
    const handler3 = {
      onItem: jest
        .fn()
        .mockImplementation((value, metadata, control) =>
          control.emitItem(value, metadata),
        ),
      onEof: jest.fn().mockImplementation((control) => control.emitEof()),
    };
    const obj3 = new Transform(dummyDataPipe, handler3);
    const res = obj1.chain(obj2).chain(obj3);
    res.onItem("1", 1);
    res.onEof();
    await res.join();
    expect(handler1.onItem).toBeCalledWith("1", 1, expect.anything());
    expect(handler2.onItem).toBeCalledWith("1", 1, expect.anything());
    expect(handler3.onItem).toBeCalledWith("1", 1, expect.anything());
    expect(handler1.onEof).toBeCalledWith(expect.anything());
    expect(handler2.onEof).toBeCalledWith(expect.anything());
    expect(handler3.onEof).toBeCalledWith(expect.anything());
  });

  it("should chain with Handler", async () => {
    const handler1 = {
      onItem: jest
        .fn()
        .mockImplementation((value, metadata, control) =>
          control.emitItem(value, metadata),
        ),
      onError: jest
        .fn()
        .mockImplementation((error, control) => control.emitError(error)),
    };
    const obj1 = new Transform(dummyDataPipe, handler1 as any);
    const handler2 = {
      onItem: jest
        .fn()
        .mockImplementation((value, metadata, control) =>
          control.emitItem(value, metadata),
        ),
      onError: jest
        .fn()
        .mockImplementation((error, control) => control.emitError(error)),
    };
    const handler3 = {
      onItem: jest
        .fn()
        .mockImplementation((value, metadata, control) =>
          control.emitItem(value, metadata),
        ),
      onError: jest
        .fn()
        .mockImplementation((error, control) => control.emitError(error)),
    };
    const res = obj1.chain(handler2, "dummy").chain(handler3, "dummy");
    res.onItem(1, "1");
    res.onError(new Error("dummy error"));
    await expect(() => res.join()).rejects.toThrow("dummy error");
    expect(handler1.onItem).toBeCalledWith(1, "1", expect.anything());
    expect(handler2.onItem).toBeCalledWith(1, "1", expect.anything());
    expect(handler3.onItem).toBeCalledWith(1, "1", expect.anything());
    expect(handler1.onError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
    expect(handler2.onError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
    expect(handler3.onError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
  });

  it("should provide filter functionality", () => {
    const obj1 = new Transform(dummyDataPipe, {} as any);
    const chain = jest
      .spyOn(obj1, "chain")
      .mockReturnValue({ mockChain: true } as any);
    const filter = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    expect(obj1.filter(filter)).toEqual({ mockChain: true });
    expect(chain).toBeCalledTimes(1);
    const callback = chain.mock.lastCall![0] as any;
    const control = {
      emitItem: jest.fn(),
    };
    callback.onItem(123, 456, control);
    expect(filter).toBeCalledWith(123, 456);
    callback.onItem(789, 111, control);
    expect(filter).toBeCalledWith(789, 111);
    expect(control.emitItem).toBeCalledWith(123, 456);
  });

  it("should provide map functionality", () => {
    const obj1 = new Transform(dummyDataPipe, {} as any);
    const chain = jest
      .spyOn(obj1, "chain")
      .mockReturnValue({ mockChain: true } as any);
    const map = jest
      .fn()
      .mockReturnValueOnce({ value: "hello", metadata: 1 })
      .mockReturnValueOnce({ value: "world", metadata: 2 });
    expect(obj1.map(map)).toEqual({ mockChain: true });
    expect(chain).toBeCalledTimes(1);
    const callback = chain.mock.lastCall![0] as any;
    const control = {
      emitItem: jest.fn(),
    };
    callback.onItem(123, 456, control);
    expect(map).toBeCalledWith(123, 456);
    expect(control.emitItem).toBeCalledWith("hello", 1);
    callback.onItem(789, 111, control);
    expect(map).toBeCalledWith(789, 111);
    expect(control.emitItem).toBeCalledWith("world", 2);
  });

  it("should provide mapValue functionality", () => {
    const obj1 = new Transform(dummyDataPipe, {} as any);
    const chain = jest
      .spyOn(obj1, "chain")
      .mockReturnValue({ mockChain: true } as any);
    const mapValue = jest
      .fn()
      .mockReturnValueOnce("hello")
      .mockReturnValueOnce("world");
    expect(obj1.mapValue(mapValue)).toEqual({ mockChain: true });
    expect(chain).toBeCalledTimes(1);
    const callback = chain.mock.lastCall![0] as any;
    const control = {
      emitItem: jest.fn(),
    };
    callback.onItem(123, 456, control);
    expect(mapValue).toBeCalledWith(123, 456);
    expect(control.emitItem).toBeCalledWith("hello", 456);
    callback.onItem(789, 111, control);
    expect(mapValue).toBeCalledWith(789, 111);
    expect(control.emitItem).toBeCalledWith("world", 111);
  });

  it("should provide mapMetadata functionality", () => {
    const obj1 = new Transform(dummyDataPipe, {} as any);
    const chain = jest
      .spyOn(obj1, "chain")
      .mockReturnValue({ mockChain: true } as any);
    const mapMetadata = jest
      .fn()
      .mockReturnValueOnce("hello")
      .mockReturnValueOnce("world");
    expect(obj1.mapMetadata(mapMetadata)).toEqual({ mockChain: true });
    expect(chain).toBeCalledTimes(1);
    const callback = chain.mock.lastCall![0] as any;
    const control = {
      emitItem: jest.fn(),
    };
    callback.onItem(123, 456, control);
    expect(mapMetadata).toBeCalledWith(123, 456);
    expect(control.emitItem).toBeCalledWith(123, "hello");
    callback.onItem(789, 111, control);
    expect(mapMetadata).toBeCalledWith(789, 111);
    expect(control.emitItem).toBeCalledWith(789, "world");
  });

  it("should provide group functionality", () => {
    const obj1 = new Transform(dummyDataPipe, {} as any);
    const chain = jest
      .spyOn(obj1, "chain")
      .mockReturnValue({ mockChain: true } as any);
    const group = jest
      .spyOn(groupModule, "group")
      .mockReturnValue({ mockGroup: true } as any);
    expect(obj1.group({ groupParams: true } as any, "dummy")).toEqual({
      mockChain: true,
    });
    expect(chain).toBeCalledWith({ mockGroup: true }, "dummy");
    expect(group).toBeCalledWith({ groupParams: true });

    jest.restoreAllMocks();
  });

  it("should provide sample functionality", () => {
    const obj1 = new Transform(dummyDataPipe, {} as any);
    const chain = jest
      .spyOn(obj1, "chain")
      .mockReturnValue({ mockChain: true } as any);
    const group = jest
      .spyOn(groupModule, "group")
      .mockReturnValue({ mockGroup: true } as any);
    expect(obj1.group({ groupParams: true } as any)).toEqual({
      mockChain: true,
    });
    expect(chain).toBeCalledWith({ mockGroup: true }, "group");
    expect(group).toBeCalledWith({ groupParams: true });

    jest.restoreAllMocks();
  });
});
