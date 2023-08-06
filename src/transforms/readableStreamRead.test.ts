import { DataPipeBase } from "../DataPipeBase";
import { readableStreamRead } from "./readableStreamRead";

describe("readableStreamInput", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  it("should read data", async () => {
    const reader = {
      read: jest.fn<
        Promise<{ value: string | undefined; done: boolean }>,
        []
      >(),
    };

    const obj = readableStreamRead<string, { meta: boolean }>(dummyDataPipe);

    reader.read
      .mockResolvedValueOnce({ value: "hello", done: false })
      .mockResolvedValueOnce({ value: "world", done: false })
      .mockResolvedValueOnce({ value: undefined, done: true });

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");
    // @ts-expect-error emitEof is protected
    const spyEmitEof = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onItem(
      {
        getReader: () => reader,
      } as unknown as ReadableStream<string>,
      { meta: true },
    );
    obj.onEof();
    await obj.join();
    expect(spyEmitItem.mock.calls).toEqual([
      ["hello", { meta: true }],
      ["world", { meta: true }],
    ]);
    expect(spyEmitEof).toBeCalled();
  });

  it("should cancel async operations", async () => {
    const reader = {
      read: jest.fn<
        Promise<{ value: string | undefined; done: boolean }>,
        []
      >(),
      cancel: jest.fn(),
    };

    let cancel = (): void => undefined;
    const cancelPromise = new Promise<{
      value: string | undefined;
      done: boolean;
    }>((_resolve, reject) => {
      cancel = () => reject(new Error("cancelled"));
    });

    const obj = readableStreamRead<string, {}>(dummyDataPipe);

    reader.read
      .mockResolvedValueOnce({ value: "hello", done: false })
      .mockReturnValueOnce(cancelPromise);

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");

    obj._start();
    obj.onItem(
      {
        getReader: () => reader,
      } as unknown as ReadableStream<string>,
      {},
    );
    await new Promise(process.nextTick);

    expect(reader.read).toBeCalledTimes(2);
    obj._cancel();
    expect(reader.cancel).toBeCalled();
    cancel();
    await expect(obj.join()).rejects.toThrow("Canceled");
    expect(spyEmitItem.mock.calls).toEqual([["hello", {}]]);
  });
});
