import { DataPipe } from "./DataPipe";

describe("DataPipe", () => {
  it("should join to all registered transforms", async () => {
    const obj = new DataPipe();

    const obj1 = {
      join: jest.fn().mockResolvedValueOnce(undefined),
    };
    const obj2 = {
      join: jest.fn().mockResolvedValueOnce(undefined),
    };
    obj._registerTransform(obj1 as any);
    obj._registerTransform(obj2 as any);
    await obj.join();
    expect(obj1.join).toBeCalledWith();
    expect(obj2.join).toBeCalledWith();
  });

  it("should provide input", async () => {
    const obj = new DataPipe();
    const input = obj.addInput(["1", "2", "3"]);

    const handler = {
      onItem: jest.fn(),
      onEof: jest.fn(),
    };
    input.chain(handler);
    await input.join();
    expect(handler.onItem.mock.calls).toEqual([
      ["1", undefined, expect.anything()],
      ["2", undefined, expect.anything()],
      ["3", undefined, expect.anything()],
    ]);
    expect(handler.onEof).toBeCalled();
  });
});
