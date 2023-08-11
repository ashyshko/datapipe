import { NormalizedHandler, normalize } from "../Handler";

export function rate<InValueT, MetadataT>(
  props: {
    onEmpty?: { sendMetadata: MetadataT };
  } = {},
): NormalizedHandler<InValueT, MetadataT, number, MetadataT> {
  let count = 0;
  let firstMetadata: MetadataT;
  return normalize({
    onItem(_value, metadata) {
      count++;
      firstMetadata = firstMetadata ?? metadata;
    },
    onEof(control) {
      if (count === 0) {
        if (props.onEmpty !== undefined) {
          control.emitItem(0, props.onEmpty.sendMetadata);
        }
      } else {
        control.emitItem(count, firstMetadata);
      }
      control.emitEof();
    },
  });
}
