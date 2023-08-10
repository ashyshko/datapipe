import { fromCsv, parseCsvLine } from "./fromCsv";

describe("parseCsvLine", () => {
  it("should split line", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = parseCsvLine();
    obj.init?.(control as any);
    obj.onItem("1,2,3", 1, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(["1", "2", "3"], 1);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should support quoted text", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = parseCsvLine();
    obj.init?.(control as any);
    obj.onItem('1",2,"3', 1, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(["1,2,3"], 1);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should support double quotes", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = parseCsvLine();
    obj.init?.(control as any);
    obj.onItem('1",""2"","3', 1, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(['1,"2",3'], 1);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should support multiline values", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = parseCsvLine();
    obj.init?.(control as any);
    obj.onItem('1"', 1, control as any);
    obj.onItem("2", 2, control as any);
    obj.onItem('"3', 3, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(["1\r\n2\r\n3"], 1);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should support single quoted text field", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = parseCsvLine();
    obj.init?.(control as any);
    obj.onItem('"1,2,3"', 1, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(["1,2,3"], 1);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should emit error if quoted text incomplete", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = parseCsvLine();
    obj.init?.(control as any);
    obj.onItem('"1', 1, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).toBeCalledWith(
      new Error("incompleted quoted string"),
    );
  });

  it("should support custom separator/newLineDelimiter", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = parseCsvLine({ separator: ";", newLineDelimiter: "\n" });
    obj.init?.(control as any);
    obj.onItem('"1', 1, control as any);
    obj.onItem('";2', 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(["1\n", "2"], 1);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should use default separator/newLineDelimiter", () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = parseCsvLine({});
    obj.init?.(control as any);
    obj.onItem('"1', 1, control as any);
    obj.onItem('",2', 2, control as any);
    obj.onEof(control as any);
    expect(control.emitItem).toBeCalledWith(["1\r\n", "2"], 1);
    expect(control.emitEof).toBeCalledWith();
  });
});

describe("fromCsv", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should work with correct data", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = fromCsv();
    obj.init?.(control as any);
    obj.onItem("field1,field2,field3\r\n", {}, control as any);
    obj.onItem("1,2,3\r\n", { meta: 1 }, control as any);
    obj.onItem("a,b,c\r\nd,e,f", { meta: 2 }, control as any);
    obj.onEof(control as any);
    await new Promise(process.nextTick);
    expect(control.emitError).not.toBeCalled();
    expect(control.emitItem.mock.calls).toEqual([
      [
        { field1: "1", field2: "2", field3: "3" },
        { originalMetadata: { meta: 1 }, lineNumber: 1 },
      ],
      [
        { field1: "a", field2: "b", field3: "c" },
        { originalMetadata: { meta: 2 }, lineNumber: 2 },
      ],
      [
        { field1: "d", field2: "e", field3: "f" },
        { originalMetadata: { meta: 2 }, lineNumber: 3 },
      ],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should throw on column count mismatch", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = fromCsv();
    obj.init?.(control as any);
    obj.onItem("field1,field2,field3\r\n", {}, control as any);
    obj.onItem("1,2,3,4\r\n", { meta: 1 }, control as any);
    obj.onEof(control as any);
    await new Promise(process.nextTick);

    expect(control.emitItem).not.toBeCalled();
    expect(control.emitError).toBeCalledWith(
      new Error("column count missmatch: expected 3, found 4"),
    );
  });

  it("should use default separator/newLineDelimiter", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = fromCsv({});
    obj.init?.(control as any);
    obj.onItem("field1,field2,field3\r\n", {}, control as any);
    obj.onItem("1,2,3\r\n", { meta: 1 }, control as any);
    obj.onItem("a,b,c\r\nd,e,f", { meta: 2 }, control as any);
    obj.onEof(control as any);
    await new Promise(process.nextTick);
    expect(control.emitError).not.toBeCalled();
    expect(control.emitItem.mock.calls).toEqual([
      [
        { field1: "1", field2: "2", field3: "3" },
        { originalMetadata: { meta: 1 }, lineNumber: 1 },
      ],
      [
        { field1: "a", field2: "b", field3: "c" },
        { originalMetadata: { meta: 2 }, lineNumber: 2 },
      ],
      [
        { field1: "d", field2: "e", field3: "f" },
        { originalMetadata: { meta: 2 }, lineNumber: 3 },
      ],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });

  it("should use provided header", async () => {
    const control = {
      emitItem: jest.fn(),
      emitError: jest.fn(),
      emitEof: jest.fn(),
    };

    const obj = fromCsv({ header: ["field1", "field2", "field3"] });
    obj.init?.(control as any);
    obj.onItem("1,2,3\r\n", { meta: 1 }, control as any);
    obj.onItem("a,b,c\r\nd,e,f", { meta: 2 }, control as any);
    obj.onEof(control as any);
    await new Promise(process.nextTick);
    expect(control.emitError).not.toBeCalled();
    expect(control.emitItem.mock.calls).toEqual([
      [
        { field1: "1", field2: "2", field3: "3" },
        { originalMetadata: { meta: 1 }, lineNumber: 0 },
      ],
      [
        { field1: "a", field2: "b", field3: "c" },
        { originalMetadata: { meta: 2 }, lineNumber: 1 },
      ],
      [
        { field1: "d", field2: "e", field3: "f" },
        { originalMetadata: { meta: 2 }, lineNumber: 2 },
      ],
    ]);
    expect(control.emitEof).toBeCalledWith();
  });
});
