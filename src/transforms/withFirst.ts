import { NormalizedHandler } from "../Handler";
import { filterMap } from "./filterMap";

export function withFirst<InValueT, InMetadataT>(): NormalizedHandler<
  InValueT,
  InMetadataT,
  { first: { value: InValueT; metadata: InMetadataT }; current: InValueT },
  InMetadataT
> {
  let firstItem: { value: InValueT; metadata: InMetadataT };
  return filterMap((value, metadata) => {
    if (firstItem === undefined) {
      firstItem = { value, metadata };
      return undefined;
    }

    return { value: { current: value, first: firstItem }, metadata };
  });
}
