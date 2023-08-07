import { Sender } from "./Sender";
import { Handler, NormalizedHandler, normalize } from "./Handler";
import { withContext } from "./withContext";

export function pipe<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
  NewValueT,
  NewMetadataT,
>(
  fromTransform: Handler<InValueT, InMetadataT, OutValueT, OutMetadataT>,
  toTransform: Handler<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
): NormalizedHandler<InValueT, InMetadataT, NewValueT, NewMetadataT> {
  const from = normalize(fromTransform);
  const to = normalize(toTransform);

  return withContext<
    InValueT,
    InMetadataT,
    NewValueT,
    NewMetadataT,
    Sender<OutValueT, OutMetadataT>
  >({
    init(control) {
      const pipe = new Sender<OutValueT, OutMetadataT>();
      from.init?.(pipe);
      to.init?.(control);

      pipe.connect({
        onItem(value, metadata) {
          to.onItem(value, metadata, control);
        },
        onError(error) {
          to.onError(error, control);
        },
        onEof() {
          to.onEof(control);
        },
      });
      return pipe;
    },
    onItem(value, metadata, control) {
      from.onItem(value, metadata, control.context);
    },
    onError(error, control) {
      from.onError(error, control.context);
    },
    onEof(control) {
      from.onEof(control.context);
    },
  });
}
