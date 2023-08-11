import { NormalizedHandler, normalize } from "../Handler";
import { filterMap } from "./filterMap";

export function accumulate<InValueT, InMetadataT, OutValueT>(
  fn: (prev: OutValueT, value: InValueT, metadata: InMetadataT) => OutValueT,
  initial: OutValueT,
): NormalizedHandler<InValueT, InMetadataT, OutValueT, InMetadataT> {
  let prev = initial;
  return filterMap((value, metadata) => {
    prev = fn(prev, value, metadata);
    return { value: prev, metadata };
  });
}
