import { DataPipeBase } from "../DataPipeBase";
import { group } from "./group";

describe("group", () => {
  const dummyDataPipe = {
    _registerTransform: jest.fn(),
  } as unknown as DataPipeBase;

  it("should group elements by provided indexFn", () => {
    const props = {
      indexFn: jest.fn<string, [string, number]>().mockImplementation((v) => v),
      startGroupFn: jest.fn(),
      addItemFn: jest.fn(),
      endGroupFn: jest.fn(),
    };
    const obj = group<string, number, number, string, string>(
      dummyDataPipe,
      props,
    );
    obj._start();
    obj.onItem("xs", 1);
    expect(props.indexFn).toBeCalledWith("xs", 1);
    expect(props.startGroupFn).toBeCalledWith("xs", expect.anything());
    expect(props.addItemFn).toBeCalledWith("xs", 1, expect.anything());
    expect(props.endGroupFn).not.toBeCalled();
    jest.clearAllMocks();

    obj.onItem("xs", 2);
    expect(props.indexFn).toBeCalledWith("xs", 2);
    expect(props.startGroupFn).not.toBeCalled();
    expect(props.addItemFn).toBeCalledWith("xs", 2, expect.anything());
    expect(props.endGroupFn).not.toBeCalled();
    jest.clearAllMocks();

    obj.onItem("xl", 3);
    expect(props.indexFn).toBeCalledWith("xl", 3);
    expect(props.endGroupFn).toBeCalledWith(undefined, expect.anything());
    expect(props.startGroupFn).toBeCalledWith("xl", expect.anything());
    expect(props.addItemFn).toBeCalledWith("xl", 3, expect.anything());
    jest.clearAllMocks();

    obj.onError(new Error("dummy error"));
    expect(props.endGroupFn).toBeCalledWith(
      new Error("dummy error"),
      expect.anything(),
    );
  });

  it("should use isIndexEqualFn", () => {
    const props = {
      indexFn: jest.fn<string, [string, number]>().mockImplementation((v) => v),
      isIndexEqualFn: jest.fn().mockReturnValue(false),
      startGroupFn: jest.fn(),
      addItemFn: jest.fn(),
      endGroupFn: jest.fn(),
    };
    const obj = group<string, number, number, string, string>(
      dummyDataPipe,
      props,
    );
    obj._start();
    obj.onItem("xs", 1);
    jest.clearAllMocks();

    obj.onItem("xs", 1);
    expect(props.isIndexEqualFn).toBeCalledWith("xs", "xs");
    expect(props.endGroupFn).toBeCalled();
    expect(props.startGroupFn).toBeCalledWith("xs", expect.anything());
  });
});
