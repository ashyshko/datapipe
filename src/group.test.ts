import { group } from "./group";
import { normalize } from "./Handler";
import * as SequenceModule from "./Sequence";
import * as HandlerModule from "./Handler";

describe("group", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should group items", async () => {
    const sequence = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    const spySequenceModule = jest
      .spyOn(SequenceModule, "Sequence")
      .mockReturnValueOnce(sequence as any);
    jest.spyOn(HandlerModule, "normalize").mockImplementation((v) => v as any);
    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      createGroup: jest.fn(),
    };
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),

      isStopped: jest.fn(),
      setCancelFn: jest.fn(),
    };
    const obj = group(handle);
    obj.init!(control as any);
    const group1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    handle.createGroup.mockReturnValueOnce(group1);
    obj.onItem(123, 456, control as any);
    expect(handle.indexFn).toBeCalledWith(123, 456);
    expect(handle.createGroup).toBeCalledWith(456);

    expect(spySequenceModule).toBeCalledTimes(1);
    const seqControl = spySequenceModule.mock.lastCall![0];
    expect(seqControl).toBe(control);

    expect(sequence.onItem).toBeCalledWith(123, 456, group1);
    expect(sequence.onError).not.toBeCalled();
    expect(sequence.onEof).not.toBeCalled();

    const group2 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    handle.createGroup.mockReturnValueOnce(group2);

    jest.clearAllMocks();
    obj.onItem(234, 345, control as any);
    expect(sequence.onItem).toBeCalledWith(234, 345, group2);
    expect(sequence.onError).not.toBeCalled();
    expect(sequence.onEof).not.toBeCalled();
  });

  it("should handle errors", () => {
    const sequence = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    jest.spyOn(SequenceModule, "Sequence").mockReturnValueOnce(sequence as any);

    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      createGroup: jest.fn(),
    };
    const control = {};
    const obj = group(handle);
    obj.init!(control as any);
    obj.onError(new Error("dummy error"), control as any);
    expect(sequence.onError).toBeCalledWith(new Error("dummy error"));
  });

  it("should handle eof", () => {
    const sequence = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    jest.spyOn(SequenceModule, "Sequence").mockReturnValueOnce(sequence as any);

    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      createGroup: jest.fn(),
    };
    const control = {};
    const obj = group(handle);
    obj.init!(control as any);
    obj.onEof(control as any);
    expect(sequence.onEof).toBeCalledWith();
  });

  it("should use isIndexEqualFn", () => {
    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      isIndexEqualFn: jest.fn().mockReturnValue(true),
      createGroup: jest.fn().mockReturnValue({ onItem: jest.fn() }),
    };
    const control = {
      emitEof: jest.fn(),
    };
    const obj = group(handle);
    obj.init!(control as any);
    const group1 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    handle.createGroup.mockReturnValueOnce(group1);
    obj.onItem(123, 456, control as any);

    jest.clearAllMocks();
    obj.onItem(789, 111, control as any);
    expect(handle.isIndexEqualFn).toBeCalledWith(456, 111);
    expect(group1.onEof).not.toBeCalled();
    expect(group1.onItem).toBeCalledWith(789, 111, expect.anything());
  });

  it("should not require init handler for group", () => {
    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      isIndexEqualFn: jest.fn().mockReturnValue(true),
      createGroup: jest.fn().mockReturnValue({ onItem: jest.fn() }),
    };
    const control = {
      emitEof: jest.fn(),
    };
    const obj = group(handle);
    obj.init!(control as any);
    const group1 = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    handle.createGroup.mockReturnValueOnce(group1);
    obj.onItem(123, 456, control as any);
  });
});
