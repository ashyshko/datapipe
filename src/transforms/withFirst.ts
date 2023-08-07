import { Handler, NormalizedHandler, normalize } from "../Handler";
import { pipe } from "../pipe";
import { filterMap } from "./filterMap";

export function withFirst<InValueT, InMetadataT, OutValueT, OutMetadataT>(
  handler: Handler<
    InValueT,
    InMetadataT & { firstItem: { value: InValueT; metadata: InMetadataT } },
    OutValueT,
    OutMetadataT
  >,
): NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  let firstItem: { value: InValueT; metadata: InMetadataT };
  return pipe(
    filterMap((value, metadata) => {
      if (firstItem === undefined) {
        firstItem = { value, metadata };
        return undefined;
      }

      return { value, metadata: { ...metadata, firstItem } };
    }),
    handler,
  );
}
