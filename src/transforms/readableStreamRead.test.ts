import { readableStreamRead } from "./readableStreamRead";

describe("readableStreamInput", () => {
  it("should read data", async () => {
    const reader = {
      read: jest.fn<
        Promise<{ value: string | undefined; done: boolean }>,
        []
      >(),
      cancel: jest.fn(),
    };

    reader.read
      .mockResolvedValueOnce({ value: "hello", done: false })
      .mockResolvedValueOnce({ value: "world", done: false })
      .mockResolvedValueOnce({ value: undefined, done: true });

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),

      setCancelFn: jest.fn(),
      isStopped: jest.fn().mockReturnValue(false),
    };

    const obj = readableStreamRead<string, { meta: boolean }>();
    obj.init!(control as any);
    obj.onItem(
      {
        getReader: () => reader,
      } as unknown as ReadableStream<string>,
      { meta: true },
      control as any,
    );
    obj.onEof(control as any);
    await new Promise(process.nextTick);
    expect(control.emitItem.mock.calls).toEqual([
      ["hello", { meta: true }],
      ["world", { meta: true }],
    ]);
    expect(control.emitEof).toBeCalled();
  });

  it("should provide cancelFn", async () => {
    const reader = {
      read: jest.fn<
        Promise<{ value: string | undefined; done: boolean }>,
        []
      >(),
      cancel: jest.fn(),
    };

    reader.read.mockResolvedValueOnce({ value: undefined, done: true });

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),

      setCancelFn: jest.fn(),
      isStopped: jest.fn().mockReturnValue(false),
    };

    const obj = readableStreamRead<string, { meta: boolean }>();
    obj.init!(control as any);
    obj.onItem(
      {
        getReader: () => reader,
      } as unknown as ReadableStream<string>,
      { meta: true },
      control as any,
    );
    await new Promise(process.nextTick);

    expect(control.setCancelFn).toBeCalled();

    const cancelCallback = control.setCancelFn.mock.lastCall![0];
    expect(reader.cancel).not.toBeCalled();
    cancelCallback();
    expect(reader.cancel).toBeCalled();
  });
});
