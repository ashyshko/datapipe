import { Chain } from "./Chain";
import { DataPipeBase } from "./DataPipeBase";

describe("Chain", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  it("should triggers original callbacks", async () => {
    const obj = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
      _start: jest.fn(),
      _cancel: jest.fn(),
      join: jest.fn().mockResolvedValue(undefined),
      chain: jest.fn().mockReturnValue("obj-chained"),
    };

    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
      _start: jest.fn(),
      _cancel: jest.fn(),
      join: jest.fn().mockResolvedValue(undefined),
      chain: jest.fn().mockReturnValue({ "receiver-chained": true }),
    };

    const chained = new Chain(dummyDataPipe, obj as any, receiver as any);

    chained._start();
    expect(obj._start).toBeCalled();
    expect(receiver._start).toBeCalled();

    chained._cancel();
    expect(obj._cancel).toBeCalled();
    expect(receiver._cancel).toBeCalled();

    await chained.join();
    expect(obj.join).toBeCalled();
    expect(receiver.join).toBeCalled();

    chained.onItem(1, 2);
    expect(obj.onItem).toBeCalledWith(1, 2);

    chained.onError(new Error("dummy error"));
    expect(obj.onError).toBeCalledWith(new Error("dummy error"));

    chained.onEof();
    expect(obj.onEof).toBeCalled();

    const nextChain = chained.chain({ "next-chain": true } as any);
    expect(nextChain.from).toBe(obj);
    expect(nextChain.to).toEqual({ "receiver-chained": true });
    expect(receiver.chain).toBeCalledWith({ "next-chain": true });
  });
});
