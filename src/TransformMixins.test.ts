import { DataPipeBase } from "./DataPipeBase";
import { TransformMixins } from "./TransformMixins";

class TransformMixinsImpl extends TransformMixins<
  string,
  number,
  number,
  string
> {
  public chain = jest.fn();
}

describe("TransformMixins", () => {
  it("should provide wraps for DataPipe mixins", () => {
    const wraps: {
      name: string;
      args: any[];
    }[] = [
      {
        name: "filter",
        args: [jest.fn(), "dummy"],
      },
      {
        name: "map",
        args: [jest.fn(), "dummy"],
      },
      {
        name: "mapValue",
        args: [jest.fn(), "dummy"],
      },
      {
        name: "mapMetadata",
        args: [jest.fn(), "dummy"],
      },
      {
        name: "group",
        args: [{ groupProps: true }, "dummy"],
      },
      {
        name: "sample",
        args: [{ sampleProps: true }, "dummy"],
      },
    ];

    wraps.forEach((test) => {
      const dataPipe = {
        _registerTransform: jest.fn(),
        [test.name]: jest.fn().mockReturnValue({ "from-data-pipe": true }),
      } as unknown as DataPipeBase;

      const obj = new TransformMixinsImpl(dataPipe);
      obj.chain.mockReturnValue({ chained: true });
      const res = (obj as any)[test.name](...test.args);
      expect(res).toEqual({ chained: true });
      expect((dataPipe as any)[test.name]).toBeCalledWith(...test.args);
      expect(obj.chain).toBeCalledWith({ "from-data-pipe": true });
    });

    // with default name
    wraps.forEach((test) => {
      const dataPipe = {
        _registerTransform: jest.fn(),
        [test.name]: jest.fn().mockReturnValue({ "from-data-pipe": true }),
      } as unknown as DataPipeBase;

      const obj = new TransformMixinsImpl(dataPipe);
      obj.chain.mockReturnValue({ chained: true });
      const res = (obj as any)[test.name](...test.args.slice(0, -1));
      expect(res).toEqual({ chained: true });
      expect((dataPipe as any)[test.name]).toBeCalledWith(
        ...test.args.slice(0, -1),
        test.name,
      );
      expect(obj.chain).toBeCalledWith({ "from-data-pipe": true });
    });
  });
});
