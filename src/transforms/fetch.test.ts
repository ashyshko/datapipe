import { DataPipe } from "../DataPipe";
import * as readableStreamReadModule from "./readableStreamRead";
import { fetch } from "./fetch";

describe("fetch", () => {
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
    };

    const spyReadableStreamRead = jest
      .spyOn(readableStreamReadModule, "readableStreamRead")
      .mockReturnValueOnce(readableStreamReadCallbacks as any);

    const obj = fetch();

    const control: any = { mockControl: true };

    obj.init?.(control);
    obj.onItem(
      { input: "url", init: { method: "POST" } },
      { metadata: "original" },
      control,
    );
    await new Promise(process.nextTick);

    expect(readableStreamReadCallbacks.onError).not.toBeCalled();
    expect(readableStreamReadCallbacks.onItem).toBeCalledWith(
      readableStream,
      {
        fetchInput: "url",
        metadata: "original",
      },
      expect.anything(),
    );

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
    };

    const spyReadableStreamRead = jest
      .spyOn(readableStreamReadModule, "readableStreamRead")
      .mockReturnValueOnce(readableStreamReadCallbacks as any);

    const control: any = { mockControl: true };

    const obj = fetch();
    obj.init?.(control as any);

    obj.onItem(
      { input: "url", init: { method: "POST" } },
      { metadata: "original" },
      control as any,
    );

    await new Promise(process.nextTick);

    expect(readableStreamReadCallbacks.onItem).not.toBeCalled();
    expect(readableStreamReadCallbacks.onEof).not.toBeCalled();
    expect(readableStreamReadCallbacks.onError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );

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
    };

    const spyReadableStreamRead = jest
      .spyOn(readableStreamReadModule, "readableStreamRead")
      .mockReturnValueOnce(readableStreamReadCallbacks as any);

    const control: any = { mockControl: true };

    const obj = fetch();
    obj.init?.(control as any);

    obj.onItem(
      { input: "url", init: { method: "POST" } },
      { metadata: "original" },
      control as any,
    );

    await new Promise(process.nextTick);

    expect(readableStreamReadCallbacks.onItem).not.toBeCalled();
    expect(readableStreamReadCallbacks.onEof).not.toBeCalled();
    expect(readableStreamReadCallbacks.onError).toBeCalledWith(
      new Error("fetch failed with HTTP error 404: Not Found"),
      expect.anything(),
    );

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
    };

    const spyReadableStreamRead = jest
      .spyOn(readableStreamReadModule, "readableStreamRead")
      .mockReturnValueOnce(readableStreamReadCallbacks as any);

    const control: any = { mockControl: true };

    const obj = fetch();
    obj.init?.(control as any);

    obj.onItem(
      { input: "url", init: { method: "POST" } },
      { metadata: "original" },
      control as any,
    );

    await new Promise(process.nextTick);

    expect(readableStreamReadCallbacks.onItem).not.toBeCalled();
    expect(readableStreamReadCallbacks.onEof).not.toBeCalled();
    expect(readableStreamReadCallbacks.onError).toBeCalledWith(
      new Error("no body provided in response"),
      expect.anything(),
    );

    spyGlobalFetch.mockRestore();
    spyReadableStreamRead.mockRestore();
  });
});
