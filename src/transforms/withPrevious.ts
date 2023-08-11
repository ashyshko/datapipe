import { NormalizedHandler } from "../Handler";
import { filterMap } from "./filterMap";

export function withPrevious<InValueT, InMetadataT>(): NormalizedHandler<
  InValueT,
  InMetadataT,
  { current: InValueT; previous: { value: InValueT; metadata: InMetadataT } },
  InMetadataT
> {
  let previousItem: { value: InValueT; metadata: InMetadataT };
  return filterMap((value, metadata) => {
    if (previousItem === undefined) {
      previousItem = { value, metadata };
      return undefined;
    }

    const res = { current: value, previous: previousItem };
    previousItem = { value, metadata };
    return {
      value: res,
      metadata,
    };
  });
}
