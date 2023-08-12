import { NormalizedHandler, normalize } from "../Handler";

export function skip<ValueT, MetadataT>(
  count: number,
): NormalizedHandler<ValueT, MetadataT, ValueT, MetadataT> {
  return normalize({
    onItem(value, metadata, control) {
      if (count > 0) {
        count--;
        return;
      }

      control.emitItem(value, metadata);
    },
  });
}
