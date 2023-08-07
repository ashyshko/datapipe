import { NormalizedHandler, normalize } from "../Handler";

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
        /* istanbul ignore next */
        const error = e instanceof Error ? e : new Error("unknown error");

        control.emitError(error);
      }
    },
  });
}
