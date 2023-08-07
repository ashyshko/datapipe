import { normalize } from "./Handler";

describe("normalize", () => {
  it("should work with already normalized handler", () => {
    const handle = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    const normalized = normalize(handle);

    normalized.init!("init-data" as any);
    expect(handle.init).toBeCalledWith("init-data");

    normalized.onItem(123, "hello", "control" as any);
    expect(handle.onItem).toBeCalledWith(123, "hello", "control");

    normalized.onError(new Error("dummy error"), "control" as any);
    expect(handle.onError).toBeCalledWith(new Error("dummy error"), "control");

    normalized.onEof("control" as any);
    expect(handle.onEof).toBeCalledWith("control");
  });

  it("should work with finalize handler", () => {
    const handle = {
      init: jest.fn(),
      onItem: jest.fn(),
      finalize: jest.fn(),
    };

    const control = {
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const normalized = normalize(handle);

    normalized.onError(new Error("dummyError"), control as any);
    expect(handle.finalize).toBeCalledWith(new Error("dummyError"), control);
    expect(control.emitError).toBeCalledWith(new Error("dummyError"));

    normalized.onEof(control as any);
    expect(handle.finalize).toBeCalledWith(undefined, control);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should work without finalize handler", () => {
    const handle = {
      init: jest.fn(),
      onItem: jest.fn(),
    };

    const control = {
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const normalized = normalize(handle);

    normalized.onError(new Error("dummyError"), control as any);
    expect(control.emitError).toBeCalledWith(new Error("dummyError"));

    normalized.onEof(control as any);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should throw if onError and finalize are provided", () => {
    const handle = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      finalize: jest.fn(),
    };

    // @ts-expect-error: prohibited by type deduction
    expect(() => normalize(handle)).toThrow(
      "Both onError and finalize are provided to normalize function",
    );
  });

  it("should throw if onEof and finalize are provided", () => {
    const handle = {
      init: jest.fn(),
      onItem: jest.fn(),
      onEof: jest.fn(),
      finalize: jest.fn(),
    };

    // @ts-expect-error: prohibited by type deduction
    expect(() => normalize(handle)).toThrow(
      "Both onEof and finalize are provided to normalize function",
    );
  });
});
