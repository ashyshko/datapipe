import { DataPipeBase } from "../DataPipeBase";
import { textDecoder } from "./textDecoder";

describe("testDecoder", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  it("should work with empty string", async () => {
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = textDecoder(dummyDataPipe, {});

    obj.chain(receiver as any);
    obj._start();
    obj.onEof();
    await obj.join();
    expect(receiver.onItem).not.toBeCalled();
  });

  it("should process single string input", async () => {
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = textDecoder(dummyDataPipe, {});

    obj.chain(receiver as any);
    obj._start();

    obj.onItem(Uint8Array.from([0x31, 0x32, 0x33]), {});
    obj.onItem(Uint8Array.from([0x34, 0x35, 0x36]), {});
    obj.onEof();
    await obj.join();
    expect(receiver.onItem.mock.calls).toEqual([
      ["123", { leftOvers: false }],
      ["456", { leftOvers: false }],
    ]);
  });

  it("should process torn utf8 characters", async () => {
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = textDecoder(dummyDataPipe, {});

    obj.chain(receiver as any);
    obj._start();

    obj.onItem(Uint8Array.from([0x31, 0x32, 0x33, 0xe2, 0x82]), {});
    obj.onItem(Uint8Array.from([0xac, 0x34]), {});
    obj.onEof();
    await obj.join();
    expect(receiver.onItem.mock.calls).toEqual([
      ["123", { leftOvers: false }],
      ["\u20ac4", { leftOvers: false }],
    ]);
  });

  it("should process incompleted utf8 characters", async () => {
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = textDecoder(dummyDataPipe, {});

    obj.chain(receiver as any);
    obj._start();

    obj.onItem(Uint8Array.from([0x31, 0x32, 0x33, 0xe2, 0x82]), {});
    obj.onEof();
    await obj.join();
    expect(receiver.onItem.mock.calls).toEqual([
      ["123", { leftOvers: false }],
      ["\ufffd", { leftOvers: true }],
    ]);
  });

  it("should support streams", async () => {
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = textDecoder<{ streamId: number }>(dummyDataPipe, {
      streamIndexFn(value, metadata) {
        return metadata.streamId;
      },
    });

    obj.chain(receiver as any);
    obj._start();

    obj.onItem(Uint8Array.from([0x31, 0x32]), { streamId: 0 });
    obj.onItem(Uint8Array.from([0x33, 0xe2, 0x82]), { streamId: 0 });
    obj.onItem(Uint8Array.from([0x34, 0x35, 0x36, 0xe2, 0x82]), {
      streamId: 1,
    });
    obj.onItem(Uint8Array.from([0xac, 0x34]), {
      streamId: 1,
    });
    obj.onEof();
    await obj.join();
    expect(receiver.onItem.mock.calls).toEqual([
      ["12", { leftOvers: false, streamId: 0, streamIndex: 0 }],
      ["3", { leftOvers: false, streamId: 0, streamIndex: 0 }],
      ["\ufffd", { leftOvers: true, streamId: 0, streamIndex: 0 }],
      ["456", { leftOvers: false, streamId: 1, streamIndex: 1 }],
      ["\u20ac4", { leftOvers: false, streamId: 1, streamIndex: 1 }],
    ]);
  });

  it("should support streams with isStreamIndexEqualFn", async () => {
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = textDecoder<{ streamId: number }>(dummyDataPipe, {
      streamIndexFn(value, metadata) {
        return metadata.streamId;
      },
      isStreamIndexEqualFn: jest.fn().mockReturnValue(true),
    });

    obj.chain(receiver as any);
    obj._start();

    obj.onItem(Uint8Array.from([0x31, 0x32, 0xe2, 0x82]), { streamId: 0 });
    obj.onItem(Uint8Array.from([0xac]), { streamId: 1 });
    obj.onEof();
    await obj.join();
    expect(receiver.onItem.mock.calls).toEqual([
      ["12", { leftOvers: false, streamId: 0, streamIndex: 0 }],
      ["\u20ac", { leftOvers: false, streamId: 1, streamIndex: 0 }],
    ]);
  });

  it("should require streamIndexFn if isStreamIndexEqualFn is set", () => {
    expect(() =>
      textDecoder(dummyDataPipe, { isStreamIndexEqualFn: jest.fn() }),
    ).toThrow(
      "textDecoder isStreamIndexEqualFn is defined without streamIndexFn",
    );
  });

  it("should not send left overs on error", async () => {
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = textDecoder(dummyDataPipe, {});

    obj.chain(receiver as any);
    obj._start();

    obj.onItem(Uint8Array.from([0x31, 0x32, 0x33, 0xe2, 0x82]), {});
    obj.onError(new Error("dummy error"));
    await expect(() => obj.join()).rejects.toThrow();
    expect(receiver.onItem.mock.calls).toEqual([["123", { leftOvers: false }]]);
  });
});
