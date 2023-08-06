import { DataPipeBase } from "../DataPipeBase";
import { sample } from "./sample";

describe("Sample", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  const dummyIndexFn = ([x, y]: [number, number], metadata: string) =>
    Math.trunc(x);

  it("should return first value for group", () => {
    const obj = sample(dummyDataPipe, {
      indexFn: dummyIndexFn,
      sampleType: "first",
    });

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");
    // @ts-expect-error emitEof is protected
    const spyEmitEof = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onItem([0.0, 10], "1");
    obj.onItem([0.3, 20], "2");
    obj.onItem([0.6, 15], "3");
    obj.onItem([1.0, 30], "4");

    expect(spyEmitItem.mock.calls).toEqual([[[0.0, 10], "1"]]);
    spyEmitItem.mockClear();

    obj.onItem([1.3, 25], "5");
    obj.onEof();
    expect(spyEmitItem.mock.calls).toEqual([[[1.0, 30], "4"]]);
    expect(spyEmitEof).toBeCalled();
  });

  it("should return last value for group", () => {
    const obj = sample(dummyDataPipe, {
      indexFn: dummyIndexFn,
      sampleType: "last",
    });

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");
    // @ts-expect-error emitEof is protected
    const spyEmitEof = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onItem([0.0, 10], "1");
    obj.onItem([0.3, 20], "2");
    obj.onItem([0.6, 15], "3");
    obj.onItem([1.0, 30], "4");

    expect(spyEmitItem.mock.calls).toEqual([[[0.6, 15], "3"]]);
    spyEmitItem.mockClear();

    obj.onItem([1.3, 25], "5");
    obj.onEof();
    expect(spyEmitItem.mock.calls).toEqual([[[1.3, 25], "5"]]);
    expect(spyEmitEof).toBeCalled();
  });

  it("should return random value for group", () => {
    const obj = sample(dummyDataPipe, {
      indexFn: dummyIndexFn,
      sampleType: "random",
    });

    jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.3) // compared for "2" (<0.5) -> selected
      .mockReturnValueOnce(0.35) // compared for "3" (>0.333) -> ignored
      .mockReturnValueOnce(0.55); // compared for "5" (>0.5) -> ignored

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");
    // @ts-expect-error emitEof is protected
    const spyEmitEof = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onItem([0.0, 10], "1");
    obj.onItem([0.3, 20], "2");
    obj.onItem([0.6, 15], "3");
    obj.onItem([1.0, 30], "4");

    expect(spyEmitItem.mock.calls).toEqual([[[0.3, 20], "2"]]);
    spyEmitItem.mockClear();

    obj.onItem([1.3, 25], "5");
    obj.onEof();
    expect(spyEmitItem.mock.calls).toEqual([[[1.0, 30], "4"]]);
    expect(spyEmitEof).toBeCalled();

    jest.spyOn(Math, "random").mockRestore();
  });

  it("should return min value for group", () => {
    const obj = sample(dummyDataPipe, {
      indexFn: dummyIndexFn,
      sampleType: {
        type: "min",
        valueFn: (v) => v[1],
      },
    });

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");
    // @ts-expect-error emitEof is protected
    const spyEmitEof = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onItem([0.0, 10], "1");
    obj.onItem([0.3, 20], "2");
    obj.onItem([0.6, 15], "3");
    obj.onItem([1.0, 30], "4");

    expect(spyEmitItem.mock.calls).toEqual([[[0.0, 10], "1"]]);
    spyEmitItem.mockClear();

    obj.onItem([1.3, 25], "5");
    obj.onEof();
    expect(spyEmitItem.mock.calls).toEqual([[[1.3, 25], "5"]]);
    expect(spyEmitEof).toBeCalled();
  });

  it("should return max value for group", () => {
    const obj = sample(dummyDataPipe, {
      indexFn: dummyIndexFn,
      sampleType: {
        type: "max",
        valueFn: (v) => v[1],
      },
    });

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");
    // @ts-expect-error emitEof is protected
    const spyEmitEof = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onItem([0.0, 10], "1");
    obj.onItem([0.3, 20], "2");
    obj.onItem([0.6, 15], "3");
    obj.onItem([1.0, 30], "4");

    expect(spyEmitItem.mock.calls).toEqual([[[0.3, 20], "2"]]);
    spyEmitItem.mockClear();

    obj.onItem([1.3, 25], "5");
    obj.onEof();
    expect(spyEmitItem.mock.calls).toEqual([[[1.0, 30], "4"]]);
    expect(spyEmitEof).toBeCalled();
  });

  it("shouldn't report on error", () => {
    const obj = sample(dummyDataPipe, {
      indexFn: dummyIndexFn,
      sampleType: {
        type: "max",
        valueFn: (v) => v[1],
      },
    });

    // @ts-expect-error emitItem is protected
    const spyEmitItem = jest.spyOn(obj, "emitItem");
    // @ts-expect-error emitEof is protected
    const spyEmitEof = jest.spyOn(obj, "emitEof");

    obj._start();
    obj.onItem([0.0, 10], "1");
    obj.onError(new Error("dummy error"));
    expect(spyEmitItem).not.toBeCalled();
  });
});
