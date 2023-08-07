import { DataPipe } from "../DataPipe";
import { textDecoder } from "./textDecoder";

describe("testDecoder", () => {
  it("should work with empty string", () => {
    const obj = textDecoder({});

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);
    obj.onEof(control as any);

    expect(control.emitItem).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should process single string input", () => {
    const obj = textDecoder({});

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);

    obj.onItem(Uint8Array.from([0x31, 0x32, 0x33]), 1, control as any);
    obj.onItem(Uint8Array.from([0x34, 0x35, 0x36]), 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ["123", { originalMetadata: 1 }],
      ["456", { originalMetadata: 2 }],
    ]);
    expect(control.emitEof).toBeCalled();
  });

  it("should process torn utf8 characters", () => {
    const obj = textDecoder({});

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);

    obj.onItem(
      Uint8Array.from([0x31, 0x32, 0x33, 0xe2, 0x82]),
      1,
      control as any,
    );
    obj.onItem(Uint8Array.from([0xac, 0x34]), 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ["123", { originalMetadata: 1 }],
      ["\u20ac4", { originalMetadata: 2 }],
    ]);
  });

  it("should process incompleted utf8 characters", () => {
    const obj = textDecoder({});

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);

    obj.onItem(
      Uint8Array.from([0x31, 0x32, 0x33, 0xe2, 0x82]),
      1,
      control as any,
    );
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ["123", { originalMetadata: 1 }],
      ["\ufffd", { originalMetadata: undefined }],
    ]);
  });

  it("should not send left overs on error", async () => {
    const obj = textDecoder({});

    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    obj.init?.(control as any);

    obj.onItem(
      Uint8Array.from([0x31, 0x32, 0x33, 0xe2, 0x82]),
      1,
      control as any,
    );
    obj.onError(new Error("dummy error"), control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ["123", { originalMetadata: 1 }],
    ]);
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
  });
});
