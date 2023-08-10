import { pipe } from "./pipe";

describe("pipe", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should send items/eof", async () => {
    const from = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const to = {
      init: jest.fn(),
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const control = {
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = pipe(from, to);
    obj.init!(control as any);
    expect(from.init).toBeCalledTimes(1);
    const fromControl = from.init.mock.lastCall![0];
    expect(to.init).toBeCalledTimes(1);
    const toControl = to.init.mock.lastCall![0];

    obj.onItem(123, 456, control as any);
    expect(from.onItem).toBeCalledWith(123, 456, fromControl);

    obj.onEof(control as any);
    expect(from.onEof).toBeCalledWith(fromControl);

    // wait sender started
    await new Promise(process.nextTick);

    fromControl.emitItem(456, 789);
    expect(to.onItem).toBeCalledWith(456, 789, toControl);

    fromControl.emitEof();
    expect(to.onEof).toBeCalledWith(toControl);
  });

  it("should send error", async () => {
    const from = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const to = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const control = {
      onError: jest.fn(),
      onEof: jest.fn(),
    };

    const obj = pipe(from, to);
    obj.init!(control as any);

    obj.onError(new Error("dummy error"), control as any);
    expect(from.onError).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
    const fromControl = from.onError.mock.lastCall![1];

    // wait sender started
    await new Promise(process.nextTick);

    fromControl.emitError(new Error("another error"));
    expect(to.onError).toBeCalledWith(
      new Error("another error"),
      expect.anything(),
    );
  });
});
