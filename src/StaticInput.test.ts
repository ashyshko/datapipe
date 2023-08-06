import { DataPipeBase } from "./DataPipeBase";
import { staticInput } from "./staticInput";

describe("staticInput", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  it("should send static content", async () => {
    const obj = staticInput(dummyDataPipe, [1, 3, 5]);

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");
    // @ts-expect-error emitEof is protected
    const spyEmitEof = jest.spyOn(obj, "emitEof");

    obj._start();
    await obj.join();
    expect(spyEmitItem.mock.calls).toEqual([
      [1, { index: 0, total: 3, progress: 0 }],
      [3, { index: 1, total: 3, progress: 1 / 3 }],
      [5, { index: 2, total: 3, progress: 2 / 3 }],
    ]);
    expect(spyEmitEof).toBeCalled();
  });

  it("should throw exception in case of onItem has been called", async () => {
    const obj = staticInput(dummyDataPipe, [1, 3, 5]);
    obj._start();
    expect(() => (obj as any).onItem()).toThrow(
      "onItem method has been called for staticInput",
    );
    await expect(() => obj.join()).rejects.toThrow(
      "onItem method has been called for staticInput",
    );
  });

  it("should throw exception in case of onError has been called", async () => {
    const obj = staticInput(dummyDataPipe, [1, 3, 5]);
    obj._start();
    expect(() => obj.onError(new Error("ignored"))).toThrow(
      "onError method has been called for staticInput",
    );
    await expect(() => obj.join()).rejects.toThrow(
      "onError method has been called for staticInput",
    );
  });

  it("should throw exception in case of onEof has been called", async () => {
    const obj = staticInput(dummyDataPipe, [1, 3, 5]);
    obj._start();
    expect(() => obj.onEof()).toThrow(
      "onEof method has been called for staticInput",
    );
    await expect(() => obj.join()).rejects.toThrow(
      "onEof method has been called for staticInput",
    );
  });
});
