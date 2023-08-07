import { toCsv } from "./toCsv";

describe("toCsv", () => {
  it("should write nothing without header and items", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({ fields: [], writeHeader: "never" });
    obj.init?.(control as any);
    obj.onEof(control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitEof).toBeCalledWith();
  });

  it("should write only header without items", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({
      fields: ["1"],
      writeHeader: { type: "always", metadata: 123 },
    });
    obj.init?.(control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith("1\r\n", 123);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should write provided items", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({ fields: ["a", "b", "c"], writeHeader: "never" });
    obj.init?.(control as any);
    obj.onItem({ a: "1", b: "2", c: "3" }, 1, control as any);
    obj.onItem({ a: "a", b: "b", c: "c", d: "d" }, 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ["1,2,3\r\n", 1],
      ["a,b,c\r\n", 2],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should quote double quotes", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({ fields: ["a", "b", "c"], writeHeader: "never" });
    obj.init?.(control as any);
    obj.onItem(
      { a: 'this is "quoted" example', b: "2", c: "3" },
      1,
      control as any,
    );
    obj.onItem({ a: "a", b: "b", c: "c", d: "d" }, 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ['"this is ""quoted"" example",2,3\r\n', 1],
      ["a,b,c\r\n", 2],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should quote new lines", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({ fields: ["a", "b", "c"], writeHeader: "never" });
    obj.init?.(control as any);
    obj.onItem(
      { a: "this is\r\nnew line example", b: "2", c: "3" },
      1,
      control as any,
    );
    obj.onItem({ a: "a", b: "b", c: "c", d: "d" }, 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ['"this is\r\nnew line example",2,3\r\n', 1],
      ["a,b,c\r\n", 2],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should quote separators", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({ fields: ["a", "b", "c"], writeHeader: "never" });
    obj.init?.(control as any);
    obj.onItem(
      { a: "this is ,,separator,, example", b: "2", c: "3" },
      1,
      control as any,
    );
    obj.onItem({ a: "a", b: "b", c: "c", d: "d" }, 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ['"this is ,,separator,, example",2,3\r\n', 1],
      ["a,b,c\r\n", 2],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should replace not defined fields with empty strings", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({ fields: ["a", "b", "c"], writeHeader: "never" });
    obj.init?.(control as any);
    obj.onItem({ a: null, b: undefined } as any, 1, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([[",,\r\n", 1]]);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should support custom separator and newline delimiters", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({
      fields: ["a", "b", "c"],
      writeHeader: { type: "always", metadata: 1 },
      separator: ";",
      newLineDelimiter: "\n",
    });
    obj.init?.(control as any);
    obj.onItem({ a: "1", b: "2", c: "3" }, 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ["a;b;c\n", 1],
      ["1;2;3\n", 2],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should write header on first item by default", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = toCsv({
      fields: ["a", "b", "c"],
    });
    obj.init?.(control as any);
    obj.onItem({ a: "1", b: "2", c: "3" }, 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem.mock.calls).toEqual([
      ["a,b,c\r\n", 2],
      ["1,2,3\r\n", 2],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });
});
