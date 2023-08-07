import { Handler, NormalizedHandler, normalize } from "../Handler";
import { pipe } from "../pipe";
import { filterMap } from "./filterMap";

export function withPrevious<InValueT, InMetadataT, OutValueT, OutMetadataT>(
  handler: Handler<
    InValueT,
    InMetadataT & { previousItem: { value: InValueT; metadata: InMetadataT } },
    OutValueT,
    OutMetadataT
  >,
): NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  let previousItem: { value: InValueT; metadata: InMetadataT };
  return pipe(
    filterMap((value, metadata) => {
      if (previousItem === undefined) {
        previousItem = { value, metadata };
        return undefined;
      }

      const res = { value, metadata: { ...metadata, previousItem } };
      previousItem = { value, metadata };
      return res;
    }),
    handler,
  );
}
