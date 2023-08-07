import { NormalizedHandler, Handler, normalize } from "./Handler";
import { withContext } from "./withContext";

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

  return withContext<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT,
    {
      currentGroup?: {
        index: IndexT;
        handler: NormalizedHandler<
          InValueT,
          InMetadataT,
          OutValueT,
          OutMetadataT
        >;
      };
    }
  >({
    init() {
      return {};
    },
    onItem(value, metadata, control) {
      const groupIndex = handler.indexFn(value, metadata);

      if (
        control.context.currentGroup !== undefined &&
        !isIndexEqualFn(control.context.currentGroup.index, groupIndex)
      ) {
        control.context.currentGroup.handler.onEof(control);
        control.context.currentGroup = undefined;
      }

      if (control.context.currentGroup === undefined) {
        const groupHandler = normalize(handler.createGroup(groupIndex));

        groupHandler.init?.(control);
        control.context.currentGroup = {
          index: groupIndex,
          handler: groupHandler,
        };
      }

      control.context.currentGroup.handler.onItem(value, metadata, control);
    },
    onError(error, control) {
      if (control.context.currentGroup !== undefined) {
        control.context.currentGroup.handler.onError(error, control);
      } else {
        control.emitError(error);
      }
    },
    onEof(control) {
      if (control.context.currentGroup !== undefined) {
        control.context.currentGroup.handler.onEof(control);
      } else {
        control.emitEof();
      }
    },
  });
}
