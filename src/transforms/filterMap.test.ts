import { filterMap } from "./filterMap";
import { DataPipeBase } from "../DataPipeBase";

describe("FilterMap", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  it("should emit mapped values using the mapping function", () => {
    const func = jest.fn().mockReturnValue({ value: 123, metadata: true });
    const obj = filterMap(dummyDataPipe, func);
    obj._start();

    // @ts-expect-error emitError is private
    const emitItemSpy = jest.spyOn(obj, "emitItem");

    // @ts-expect-error processItem is protected
    const processItem = obj.processItem.bind(obj);

    processItem(42, "dummy");
    expect(func.mock.calls).toEqual([[42, "dummy"]]);
    expect(emitItemSpy.mock.calls).toEqual([[123, true]]);
  });

  it("should not emit anything when the mapping function returns undefined", () => {
    const func = jest.fn().mockReturnValue(undefined);
    const obj = filterMap(dummyDataPipe, func);
    obj._start();

    // @ts-expect-error emitItem is private
    const emitItemSpy = jest.spyOn(obj, "emitItem");

    // @ts-expect-error processItem is protected
    const processItem = obj.processItem.bind(obj);

    processItem(42, "dummy");
    expect(func.mock.calls).toEqual([[42, "dummy"]]);
    expect(emitItemSpy).not.toBeCalled();
  });
});
