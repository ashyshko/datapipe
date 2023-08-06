import { DataPipeBase } from "../DataPipeBase";
import * as readableStreamReadModule from "./readableStreamRead";
import { fetch } from "./fetch";

describe("fetch", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  it("should pipe body to readableStream", async () => {
    const spyGlobalFetch = jest.spyOn(global, "fetch");

    const readableStream = { mock: "ReadableStream" };
    spyGlobalFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      body: readableStream,
    } as unknown as ReturnType<typeof global.fetch>);

    const readableStreamReadCallbacks = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),

      join: jest.fn().mockReturnValue(undefined),

      _start: jest.fn(),
      _cancel: jest.fn(),
    };

    const spyReadableStreamRead = jest
      .spyOn(readableStreamReadModule, "readableStreamRead")
      .mockReturnValueOnce(readableStreamReadCallbacks as any);

    const obj = fetch(dummyDataPipe);
    obj._start();

    obj.onItem(
      { input: "url", init: { method: "POST" } },
      { metadata: "original" },
    );
    obj.onEof();
    await obj.join();

    expect(readableStreamReadCallbacks.onItem).toBeCalledWith(readableStream, {
      fetchInput: "url",
      metadata: "original",
    });
    expect(readableStreamReadCallbacks.onEof).toBeCalled();

    spyGlobalFetch.mockRestore();
    spyReadableStreamRead.mockRestore();
  });

  it("should trigger error in case of network error", async () => {
    const spyGlobalFetch = jest.spyOn(global, "fetch");

    spyGlobalFetch.mockRejectedValue(new Error("dummy error"));

    const readableStreamReadCallbacks = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),

      join: jest.fn().mockReturnValue(undefined),

      _start: jest.fn(),
      _cancel: jest.fn(),
    };

    const spyReadableStreamRead = jest
      .spyOn(readableStreamReadModule, "readableStreamRead")
      .mockReturnValueOnce(readableStreamReadCallbacks as any);

    const obj = fetch(dummyDataPipe);
    obj._start();

    obj.onItem(
      { input: "url", init: { method: "POST" } },
      { metadata: "original" },
    );
    await expect(() => obj.join()).rejects.toThrow("dummy error");

    expect(readableStreamReadCallbacks.onItem).not.toBeCalled();
    expect(readableStreamReadCallbacks.onEof).not.toBeCalled();

    spyGlobalFetch.mockRestore();
    spyReadableStreamRead.mockRestore();
  });

  it("should trigger error in case of HTTP error", async () => {
    const spyGlobalFetch = jest.spyOn(global, "fetch");

    spyGlobalFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as unknown as ReturnType<typeof global.fetch>);

    const readableStreamReadCallbacks = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),

      join: jest.fn().mockReturnValue(undefined),

      _start: jest.fn(),
      _cancel: jest.fn(),
    };

    const spyReadableStreamRead = jest
      .spyOn(readableStreamReadModule, "readableStreamRead")
      .mockReturnValueOnce(readableStreamReadCallbacks as any);

    const obj = fetch(dummyDataPipe);
    obj._start();

    obj.onItem(
      { input: "url", init: { method: "POST" } },
      { metadata: "original" },
    );
    await expect(() => obj.join()).rejects.toThrow(
      "fetch failed with HTTP error 404: Not Found",
    );

    expect(readableStreamReadCallbacks.onItem).not.toBeCalled();
    expect(readableStreamReadCallbacks.onEof).not.toBeCalled();

    spyGlobalFetch.mockRestore();
    spyReadableStreamRead.mockRestore();
  });

  it("should trigger error in case of HTTP body absence", async () => {
    const spyGlobalFetch = jest.spyOn(global, "fetch");

    spyGlobalFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      body: null,
    } as unknown as ReturnType<typeof global.fetch>);

    const readableStreamReadCallbacks = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),

      join: jest.fn().mockReturnValue(undefined),

      _start: jest.fn(),
      _cancel: jest.fn(),
    };

    const spyReadableStreamRead = jest
      .spyOn(readableStreamReadModule, "readableStreamRead")
      .mockReturnValueOnce(readableStreamReadCallbacks as any);

    const obj = fetch(dummyDataPipe);
    obj._start();

    obj.onItem(
      { input: "url", init: { method: "POST" } },
      { metadata: "original" },
    );
    await expect(() => obj.join()).rejects.toThrow(
      "no body provided in response",
    );

    expect(readableStreamReadCallbacks.onItem).not.toBeCalled();
    expect(readableStreamReadCallbacks.onEof).not.toBeCalled();

    spyGlobalFetch.mockRestore();
    spyReadableStreamRead.mockRestore();
  });
});
