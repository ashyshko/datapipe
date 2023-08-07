import { splitString } from "./splitString";

describe("splitString", () => {
  it("should work without items provided", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = splitString("\n");
    obj.init?.(control as any);
    obj.onEof(control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should not report leftovers on error", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = splitString("\n");
    obj.init?.(control as any);
    obj.onItem("123", 1, control as any);
    obj.onError(new Error("dummy error"), control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).toBeCalledWith(new Error("dummy error"));
    expect(control.emitEof).not.toBeCalled();
  });

  describe("with string separator", () => {
    it("should split provided string", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString("\n");
      obj.init?.(control as any);
      obj.onItem("123\n234", 1, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["123", 1],
        ["234", 1],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should combine multiple chunks", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString("\n");
      obj.init?.(control as any);
      obj.onItem("123\n2", 1, control as any);
      obj.onItem("34", 2, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["123", 1],
        ["234", 1],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should support trailing separator", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString("\n");
      obj.init?.(control as any);
      obj.onItem("123\n", 1, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([["123", 1]]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should provide proper metadata", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString("\n");
      obj.init?.(control as any);
      obj.onItem("123\n", 1, control as any);
      obj.onItem("234\n", 2, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["123", 1],
        ["234", 2],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should check for empty separators", () => {
      expect(() => splitString("")).toThrow(
        "incorrect separator provided: empty string",
      );
    });

    it("should support splitted separators", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString("\r\n");
      obj.init?.(control as any);
      obj.onItem("123\r", 1, control as any);
      obj.onItem("\n234", 2, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["123", 1],
        ["234", 2],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should provide empty strings", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString("\n");
      obj.init?.(control as any);
      obj.onItem("1\n\n\n", 1, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["1", 1],
        ["", 1],
        ["", 1],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });
  });

  describe("with regex separator", () => {
    it("should split provided string", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString(/\n/);
      obj.init?.(control as any);
      obj.onItem("123\n234", 1, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["123", 1],
        ["234", 1],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should combine multiple chunks", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString(/\n/);
      obj.init?.(control as any);
      obj.onItem("123\n2", 1, control as any);
      obj.onItem("34", 2, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["123", 1],
        ["234", 1],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should support trailing separator", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString(/\n/);
      obj.init?.(control as any);
      obj.onItem("123\n", 1, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([["123", 1]]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should provide proper metadata", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString(/\n/);
      obj.init?.(control as any);
      obj.onItem("123\n", 1, control as any);
      obj.onItem("234\n", 2, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["123", 1],
        ["234", 2],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should support variable length separators", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString(/(\r?\n)|(\r)/);
      obj.init?.(control as any);
      obj.onItem("123\n234\r345\r", 1, control as any);
      obj.onItem("\n456\n", 2, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["123", 1],
        ["234", 1],
        ["345", 1],
        ["456", 2],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });

    it("should check for empty separators", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString(/.?/);
      obj.init?.(control as any);
      expect(() => obj.onItem("123\n234\r345\r", 1, control as any)).toThrow(
        "incorrect separator provided: empty string has been captured",
      );
    });

    it("should provide empty strings", () => {
      const control = {
        emitItem: jest.fn(),
        emitError: jest.fn(),
        emitEof: jest.fn(),
      };

      const obj = splitString(/\n/);
      obj.init?.(control as any);
      obj.onItem("1\n\n\n", 1, control as any);
      obj.onEof(control as any);
      expect(control.emitItem.mock.calls).toEqual([
        ["1", 1],
        ["", 1],
        ["", 1],
      ]);
      expect(control.emitError).not.toBeCalled();
      expect(control.emitEof).toBeCalledWith();
    });
  });
});
