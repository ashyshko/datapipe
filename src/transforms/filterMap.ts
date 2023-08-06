import { transform } from "../transformFn";
import { DataPipeBase } from "../DataPipeBase";

export function filterMap<InValueT, InMetadataT, OutValueT, OutMetadataT>(
  dataPipe: DataPipeBase,
  fn: (
    value: InValueT,
    metadata: InMetadataT,
  ) => { value: OutValueT; metadata: OutMetadataT } | undefined,
  name = "filterMap",
) {
  return transform<InValueT, InMetadataT, OutValueT, OutMetadataT>(
    dataPipe,
    {
      processItem(value: InValueT, metadata: InMetadataT, ctx): void {
        const transformed = fn(value, metadata);
        if (transformed !== undefined) {
          ctx.emitItem(transformed.value, transformed.metadata);
        }
      },
    },
    name,
  );
}
