import { NormalizedHandler } from "../Handler";
import { withContext } from "../withContext";

export function textDecoder<MetadataT>(props: {
  label?: string;
  options?: ConstructorParameters<typeof TextDecoder>[1];
}): NormalizedHandler<
  Uint8Array,
  MetadataT,
  string,
  { originalMetadata?: MetadataT }
> {
  return withContext({
    init() {
      return new TextDecoder(props.label, props.options);
    },
    onItem(value, metadata, control) {
      const chunk = control.context.decode(value, { stream: true });
      control.emitItem(chunk, { originalMetadata: metadata });
    },
    onEof(control) {
      const leftOvers = control.context.decode(undefined, { stream: false });
      if (leftOvers.length > 0) {
        control.emitItem(leftOvers, { originalMetadata: undefined });
      }
      control.emitEof();
    },
  });
}
