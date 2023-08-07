import { group } from "./group";

describe("group", () => {
  it("should group items", () => {
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
    expect(group1.init).toBeCalledWith(expect.anything());

    const groupControl = group1.init.mock.lastCall![0];

    groupControl.emitItem("1", "2");
    expect(control.emitItem).toBeCalledWith("1", "2");

    groupControl.emitError(new Error("dummy error"));
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));

    groupControl.emitEof();
    expect(control.emitEof).toBeCalledWith();

    control.isStopped.mockReturnValue("stopped-result");
    expect(groupControl.isStopped()).toBe("stopped-result");

    groupControl.setCancelFn("cancel-fn-mock");
    expect(control.setCancelFn).toBeCalledWith("cancel-fn-mock");

    expect(group1.onItem).toBeCalledWith(123, 456, groupControl);

    jest.clearAllMocks();
    obj.onItem(124, 456, control as any);
    expect(handle.indexFn).toBeCalledWith(124, 456);
    expect(handle.createGroup).not.toBeCalled();
    expect(group1.init).not.toBeCalled();
    expect(group1.onItem).toBeCalledWith(124, 456, groupControl);
    expect(group1.onEof).not.toBeCalled();

    jest.clearAllMocks();
    const group2 = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    handle.createGroup.mockReturnValueOnce(group2);
    obj.onItem(456, 789, control as any);
    expect(handle.indexFn).toBeCalledWith(456, 789);
    expect(group1.onEof).toBeCalledWith(expect.anything());
    expect(handle.createGroup).toBeCalledWith(789);
    expect(group2.init).toBeCalledWith(expect.anything());
    expect(group2.onItem).toBeCalledWith(456, 789, expect.anything());

    jest.clearAllMocks();
    obj.onEof(control as any);
    expect(group2.onEof).toBeCalledWith(expect.anything());
  });

  it("should handle errors", () => {
    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      createGroup: jest.fn(),
    };
    const control = {
      onError: jest.fn(),
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
    obj.onError(new Error("dummy error"), control as any);
    expect(group1.onError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
    expect(control.onError).not.toBeCalled();
  });

  it("should handle error without items", () => {
    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      createGroup: jest.fn(),
    };
    const control = {
      emitError: jest.fn(),
    };
    const obj = group(handle);
    obj.init!(control as any);
    obj.onError(new Error("dummy error"), control as any);
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
  });

  it("should handle eof without items", () => {
    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      createGroup: jest.fn(),
    };
    const control = {
      emitEof: jest.fn(),
    };
    const obj = group(handle);
    obj.init!(control as any);
    obj.onEof(control as any);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should use isIndexEqualFn", () => {
    const handle = {
      indexFn: jest.fn().mockImplementation((value, metadata) => metadata),
      isIndexEqualFn: jest.fn().mockReturnValue(true),
      createGroup: jest.fn(),
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
      createGroup: jest.fn(),
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
