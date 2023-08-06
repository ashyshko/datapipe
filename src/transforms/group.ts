import { DataPipeBase } from "../DataPipeBase";
import { ContextT } from "../ITransform";
import { transform } from "../transformFn";

export function group<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
  IndexT = number,
>(
  dataPipe: DataPipeBase,
  props: {
    indexFn: (value: InValueT, metadata: InMetadataT) => IndexT;
    isIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
    startGroupFn: (
      groupIndex: IndexT,
      ctx: ContextT<OutValueT, OutMetadataT>,
    ) => void;
    addItemFn: (
      value: InValueT,
      metadata: InMetadataT,
      ctx: ContextT<OutValueT, OutMetadataT>,
    ) => void | Promise<void>;
    endGroupFn: (
      error: Error | undefined,
      ctx: ContextT<OutValueT, OutMetadataT>,
    ) => void;
  },
  name = "group",
) {
  let currentGroup: { index: IndexT } | undefined;

  const isIndexEqualFn = props.isIndexEqualFn ?? ((l, r) => l === r);

  return transform<InValueT, InMetadataT, OutValueT, OutMetadataT>(
    dataPipe,
    {
      processItem(value, metadata, ctx) {
        const groupIndex = props.indexFn(value, metadata);
        if (
          currentGroup !== undefined &&
          !isIndexEqualFn(currentGroup.index, groupIndex)
        ) {
          currentGroup = undefined;
          props.endGroupFn(undefined, ctx);
        }

        if (currentGroup === undefined) {
          props.startGroupFn(groupIndex, ctx);
          currentGroup = { index: groupIndex };
        }

        return props.addItemFn(value, metadata, ctx);
      },
      finalize(error, ctx) {
        if (currentGroup !== undefined) {
          currentGroup = undefined;
          props.endGroupFn(error, ctx);
        }
      },
    },
    name,
  );
}
