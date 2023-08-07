import { Sender } from "./Sender";

describe("Sender", () => {
  it("should work without data sent", async () => {
    const sender = new Sender();
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    sender.connect(receiver);

    sender.emitEof();
    await sender.join();
    expect(receiver.onEof).toBeCalled();
  });

  it("should send emited items / errors to subscriber", async () => {
    const sender = new Sender();
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    sender.connect(receiver);

    sender.emitItem(123, "hello");
    sender.emitError(new Error("dummy error"));
    await expect(() => sender.join()).rejects.toThrow("dummy error");
    expect(receiver.onItem).toBeCalledWith(123, "hello");
    expect(receiver.onError).toBeCalledWith(new Error("dummy error"));
    expect(receiver.onEof).not.toBeCalled();
  });

  it("should ignore items / errors / eof after error", async () => {
    const sender = new Sender();
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    sender.connect(receiver);

    sender.emitError(new Error("dummy error"));
    sender.emitItem(123, "hello");
    sender.emitError(new Error("another error"));
    sender.emitEof();
    await expect(() => sender.join()).rejects.toThrow("dummy error");
    expect(receiver.onItem).not.toBeCalled();
    expect(receiver.onError).toBeCalledWith(new Error("dummy error"));
    expect(receiver.onEof).not.toBeCalled();
  });

  it("shouldn't emit items during initialization", async () => {
    const sender = new Sender();
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    sender.connect(receiver);

    sender.emitItem(123, "hello");
    sender.emitEof();
    expect(receiver.onItem).not.toBeCalled();
    expect(receiver.onEof).not.toBeCalled();
    await sender.join();
    expect(receiver.onItem).toBeCalledWith(123, "hello");
    expect(receiver.onEof).toBeCalledWith();
  });

  it("should emit items immediately after initialization", async () => {
    const sender = new Sender();
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    sender.connect(receiver);

    // wait for started
    await new Promise(process.nextTick);

    sender.emitItem(123, "hello");
    expect(receiver.onItem).toBeCalledWith(123, "hello");

    sender.emitEof();
    expect(receiver.onEof).toBeCalledWith();
  });

  it("should throw on emit item after eof", async () => {
    const sender = new Sender();
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    sender.connect(receiver);

    sender.emitEof();

    expect(() => sender.emitItem(123, "hello")).toThrow(
      "emitItem has been called after emitEof",
    );
    await sender.join();
    expect(receiver.onItem).not.toBeCalled();
  });

  it("should provide isStopped status", async () => {
    const sender = new Sender();
    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    sender.connect(receiver);

    expect(sender.isStopped()).toBeFalsy();
    sender.emitEof();
    expect(sender.isStopped()).toBeTruthy();
  });

  it("should throw on connect after initialization", async () => {
    const sender = new Sender();

    // wait for started
    await new Promise(process.nextTick);

    const receiver = {
      onItem: jest.fn(),
      onError: jest.fn(),
      onEof: jest.fn(),
    };
    expect(() => sender.connect(receiver)).toThrow(
      "connect has been called after initialization",
    );
  });

  describe("join", () => {
    it("should join after initialization", async () => {
      const sender = new Sender();
      const receiver = {
        onItem: jest.fn(),
        onError: jest.fn(),
        onEof: jest.fn(),
      };
      sender.connect(receiver);

      // wait for started
      await new Promise(process.nextTick);

      const join = sender.join();
      sender.emitEof();
      await join;
    });

    it("should join after eof", async () => {
      const sender = new Sender();
      const receiver = {
        onItem: jest.fn(),
        onError: jest.fn(),
        onEof: jest.fn(),
      };
      sender.connect(receiver);

      // wait for started
      await new Promise(process.nextTick);
      sender.emitEof();

      await sender.join();
    });

    it("should join after error", async () => {
      const sender = new Sender();
      const receiver = {
        onItem: jest.fn(),
        onError: jest.fn(),
        onEof: jest.fn(),
      };
      sender.connect(receiver);

      // wait for started
      await new Promise(process.nextTick);
      sender.emitError(new Error("dummy error"));

      await expect(() => sender.join()).rejects.toThrow("dummy error");
    });
  });

  describe("cancelFn", () => {
    it("shouldn't be called in case of normal completion", async () => {
      const sender = new Sender();
      const receiver = {
        onItem: jest.fn(),
        onError: jest.fn(),
        onEof: jest.fn(),
      };
      sender.connect(receiver);

      const cancelFn = jest.fn();
      sender.setCancelFn(cancelFn);

      sender.emitEof();
      await sender.join();
      expect(cancelFn).not.toBeCalled();
    });

    it("should be called in case of error", async () => {
      const sender = new Sender();
      const receiver = {
        onItem: jest.fn(),
        onError: jest.fn(),
        onEof: jest.fn(),
      };
      sender.connect(receiver);

      const cancelFn = jest.fn();
      sender.setCancelFn(cancelFn);

      sender.emitError(new Error("dummy error"));
      await expect(() => sender.join()).rejects.toThrow("dummy error");
      expect(cancelFn).toBeCalledWith();
    });

    it("should be called immediately if error is already emitted", async () => {
      const sender = new Sender();
      const receiver = {
        onItem: jest.fn(),
        onError: jest.fn(),
        onEof: jest.fn(),
      };
      sender.connect(receiver);

      sender.emitError(new Error("dummy error"));

      const cancelFn = jest.fn();
      sender.setCancelFn(cancelFn);
      expect(cancelFn).toBeCalledWith();

      await expect(() => sender.join()).rejects.toThrow("dummy error");
    });

    it("should be called on error after initialization", async () => {
      const sender = new Sender();
      const receiver = {
        onItem: jest.fn(),
        onError: jest.fn(),
        onEof: jest.fn(),
      };
      sender.connect(receiver);

      // wait for started
      await new Promise(process.nextTick);

      const cancelFn = jest.fn();
      sender.setCancelFn(cancelFn);
      expect(cancelFn).not.toBeCalled();

      sender.emitError(new Error("dummy error"));
      expect(cancelFn).toBeCalledWith();
    });

    it("shouldn't be called after eof", async () => {
      const sender = new Sender();
      const receiver = {
        onItem: jest.fn(),
        onError: jest.fn(),
        onEof: jest.fn(),
      };
      sender.connect(receiver);

      sender.emitEof();

      const cancelFn = jest.fn();
      sender.setCancelFn(cancelFn);
      expect(cancelFn).not.toBeCalled();
    });
  });
});
