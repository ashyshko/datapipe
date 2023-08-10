import { NormalizedHandler, Handler, normalize } from "./Handler";
import { Sequence } from "./Sequence";

export function group<InValueT, InMetadataT, OutValueT, OutMetadataT, IndexT>(
  handler: {
    indexFn(value: InValueT, metadata: InMetadataT): IndexT;
  } & (undefined | boolean | number | bigint | string extends IndexT
    ? {
        isIndexEqualFn?(index1: IndexT, index2: IndexT): boolean;
      }
    : {
        isIndexEqualFn(index1: IndexT, index2: IndexT): boolean;
      }) & {
      createGroup(
        index: IndexT,
      ): Handler<InValueT, InMetadataT, OutValueT, OutMetadataT>;
    },
): NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  const isIndexEqualFn =
    handler.isIndexEqualFn ?? ((index1, index2) => index1 === index2);

  let sequence: Sequence<InValueT, InMetadataT, OutValueT, OutMetadataT>;

  let context:
    | {
        index: IndexT;
        handler: NormalizedHandler<
          InValueT,
          InMetadataT,
          OutValueT,
          OutMetadataT
        >;
      }
    | undefined;

  return normalize({
    init(control) {
      sequence = new Sequence(control);
    },
    onItem(value, metadata) {
      const groupIndex = handler.indexFn(value, metadata);

      if (context !== undefined && !isIndexEqualFn(context.index, groupIndex)) {
        context = undefined;
      }

      if (context === undefined) {
        context = {
          index: groupIndex,
          handler: normalize(handler.createGroup(groupIndex)),
        };
      }

      sequence.onItem(value, metadata, context.handler);
    },
    onError(error) {
      sequence.onError(error);
    },
    onEof() {
      sequence.onEof();
    },
  });
}
