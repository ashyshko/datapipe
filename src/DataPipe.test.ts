import { DataPipe } from "./DataPipe";
import { ITransform, ITransformMixins } from "./ITransform";
import * as staticInputModule from "./staticInput";
import * as filterMapModule from "./transforms/filterMap";
import * as groupModule from "./transforms/group";
import * as sampleModule from "./transforms/sample";

describe("DataPipe", () => {
  it("should register sender", () => {
    const dataPipe = new DataPipe();
    // @ts-expect-error ts(2341): Property 'transforms' is private and only accessible within class 'DataPipe'.
    const registeredTransforms = dataPipe.transforms;

    const transform = {} as ITransform<any, any, any, any>;
    dataPipe._registerTransform(transform);
    expect(registeredTransforms).toEqual([transform]);
  });

  it("should call Sender._start on start", () => {
    const dataPipe = new DataPipe();

    const transform = {
      _start: jest.fn(),
    } as unknown as ITransform<any, any, any, any>;
    dataPipe._registerTransform(transform);

    dataPipe.start();
    expect(transform._start).toBeCalled();
  });

  it("should call Sender._cancel on cancel", () => {
    const dataPipe = new DataPipe();

    const transform = {
      _cancel: jest.fn(),
    } as unknown as ITransform<any, any, any, any>;
    dataPipe._registerTransform(transform);

    dataPipe.cancel();
    expect(transform._cancel).toBeCalled();
  });

  it("should wait for all senders on join", async () => {
    const dataPipe = new DataPipe();

    const transform = {
      join: jest.fn<Promise<void>, []>().mockResolvedValue(),
    } as unknown as ITransform<any, any, any, any>;
    dataPipe._registerTransform(transform);

    await dataPipe.join();
    expect(transform.join).toBeCalled();
  });

  it("should use staticInput for addStaticInput", () => {
    const staticInput = jest
      .spyOn(staticInputModule, "staticInput")
      .mockReturnValue("staticInputFunc" as any);

    const dataPipe = new DataPipe();
    expect(dataPipe.addStaticInput([1, 2, 3])).toEqual("staticInputFunc");
    expect(staticInput).toBeCalledWith(dataPipe, [1, 2, 3], "staticInput");
  });

  it("should use filterMap for filter", () => {
    const filterMap = jest
      .spyOn(filterMapModule, "filterMap")
      .mockReturnValue("filterMapFunc" as any);

    const dataPipe = new DataPipe();
    const callbackFn = jest.fn();
    const res = dataPipe.filter(callbackFn, "dummy");

    expect(res).toBe("filterMapFunc");
    expect(filterMap).toBeCalledWith(dataPipe, expect.anything(), "dummy");
    const providedCallbackFn = filterMap.mock.lastCall?.[1]!;

    callbackFn.mockReturnValueOnce(false);
    expect(providedCallbackFn(10, 20)).toBeUndefined();
    expect(callbackFn).toBeCalledWith(10, 20);

    callbackFn.mockReturnValueOnce(true);
    expect(providedCallbackFn(30, 40)).toEqual({ value: 30, metadata: 40 });
    expect(callbackFn).toBeCalledWith(30, 40);

    filterMap.mockRestore();
  });

  it("should use filterMap for map", () => {
    const filterMap = jest
      .spyOn(filterMapModule, "filterMap")
      .mockReturnValue("filterMapFunc" as any);

    const dataPipe = new DataPipe();
    const callbackFn = jest.fn();
    const res = dataPipe.map(callbackFn, "dummy");

    expect(res).toBe("filterMapFunc");
    expect(filterMap).toBeCalledWith(dataPipe, expect.anything(), "dummy");
    const providedCallbackFn = filterMap.mock.lastCall?.[1]!;

    callbackFn.mockReturnValueOnce({ value: 30, metadata: 40 });
    expect(providedCallbackFn(10, 20)).toEqual({ value: 30, metadata: 40 });
    expect(callbackFn).toBeCalledWith(10, 20);

    filterMap.mockRestore();
  });

  it("should use filterMap for mapValue", () => {
    const filterMap = jest
      .spyOn(filterMapModule, "filterMap")
      .mockReturnValue("filterMapFunc" as any);

    const dataPipe = new DataPipe();
    const callbackFn = jest.fn();
    const res = dataPipe.mapValue(callbackFn, "dummy");

    expect(res).toBe("filterMapFunc");
    expect(filterMap).toBeCalledWith(dataPipe, expect.anything(), "dummy");
    const providedCallbackFn = filterMap.mock.lastCall?.[1]!;

    callbackFn.mockReturnValueOnce(30);
    expect(providedCallbackFn(10, 20)).toEqual({ value: 30, metadata: 20 });
    expect(callbackFn).toBeCalledWith(10, 20);

    filterMap.mockRestore();
  });

  it("should use filterMap for mapMetadata", () => {
    const filterMap = jest
      .spyOn(filterMapModule, "filterMap")
      .mockReturnValue("filterMapFunc" as any);

    const dataPipe = new DataPipe();
    const callbackFn = jest.fn();
    const res = dataPipe.mapMetadata(callbackFn, "dummy");

    expect(res).toBe("filterMapFunc");
    expect(filterMap).toBeCalledWith(dataPipe, expect.anything(), "dummy");
    const providedCallbackFn = filterMap.mock.lastCall?.[1]!;

    callbackFn.mockReturnValueOnce(30);
    expect(providedCallbackFn(10, 20)).toEqual({ value: 10, metadata: 30 });
    expect(callbackFn).toBeCalledWith(10, 20);

    filterMap.mockRestore();
  });

  it("should use groupModule for group", () => {
    const group = jest
      .spyOn(groupModule, "group")
      .mockReturnValue("groupFunc" as any);

    const dataPipe = new DataPipe();
    const groupProps = { groupProps: true };
    const res = dataPipe.group(groupProps as any, "dummy");

    expect(res).toBe("groupFunc");
    expect(group).toBeCalledWith(dataPipe, groupProps, "dummy");
    group.mockRestore();
  });

  it("should use sampleModule for sample", () => {
    const group = jest
      .spyOn(sampleModule, "sample")
      .mockReturnValue("sampleFunc" as any);

    const dataPipe = new DataPipe();
    const props = { sampleProps: true };
    const res = dataPipe.sample(props as any, "dummy");

    expect(res).toBe("sampleFunc");
    expect(group).toBeCalledWith(dataPipe, props, "dummy");
    group.mockRestore();
  });
});
