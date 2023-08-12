import { NormalizedHandler, normalize } from "../Handler";

export function toJson<
  T extends Record<string, unknown>,
  MetadataT,
>(): NormalizedHandler<T, MetadataT, string, MetadataT> {
  let initialized = false;
  let lastMetadata: MetadataT;
  return normalize({
    onItem(value, metadata, control) {
      const prefix = initialized ? ", " : "[";
      lastMetadata = metadata;
      initialized = true;
      control.emitItem(prefix + JSON.stringify(value), metadata);
    },
    onEof(control) {
      if (initialized) {
        control.emitItem("]", lastMetadata);
      }
      control.emitEof();
    },
  });
}
