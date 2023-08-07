import { writableStreamWrite } from "./writableStreamWrite";

describe("writableStreamWrite", () => {
  it("should write items", async () => {
    const streamWriter = {
      getReady: jest.fn().mockResolvedValue(undefined),
      write: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(streamWriter, "ready", {
      get: streamWriter.getReady,
    });

    const stream = {
      getWriter: jest.fn().mockReturnValueOnce(streamWriter),
    };

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = writableStreamWrite(stream as any);
    obj.init?.(control as any);
    obj.onItem(1, 2, control as any);
    await new Promise(process.nextTick);
    expect(streamWriter.getReady).toBeCalledWith();
    expect(streamWriter.write).toBeCalledWith(1);
    obj.onEof(control as any);
    await new Promise(process.nextTick);
    expect(streamWriter.close).toBeCalledWith();
  });
});
