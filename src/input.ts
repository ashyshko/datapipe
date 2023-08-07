import { ControlT, NormalizedHandler, normalize } from "./Handler";

export function input<OutValueT, OutMetadataT>(
  init: (control: ControlT<OutValueT, OutMetadataT>) => void,
): NormalizedHandler<never, never, OutValueT, OutMetadataT> {
  return normalize({
    init,
    onItem() {
      throw new Error("onItem called for input");
    },
    onError() {
      throw new Error("onError called for input");
    },
    onEof() {
      throw new Error("onEof called for input");
    },
  });
}
