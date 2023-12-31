import { NormalizedHandler, normalize } from "../Handler";
import { toError } from "../utils/toError";

export function filterMap<InValueT, InMetadataT, OutValueT, OutMetadataT>(
  callback: (
    value: InValueT,
    metadata: InMetadataT,
  ) => { value: OutValueT; metadata: OutMetadataT } | undefined,
): NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  return normalize({
    onItem(value, metadata, control) {
      try {
        const mapped = callback(value, metadata);
        if (mapped !== undefined) {
          control.emitItem(mapped.value, mapped.metadata);
        }
      } catch (e) {
        control.emitError(toError(e));
      }
    },
  });
}
