import { DataPipeBase } from "../DataPipeBase";
import { SampleType } from "../ITransform";
import { group } from "./group";

export function sample<ValueT, MetadataT, IndexT = number>(
  dataPipe: DataPipeBase,
  props: {
    indexFn: (value: ValueT, metadata: MetadataT) => IndexT;
    isIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
    sampleType: SampleType<ValueT, MetadataT>;
  },
  name = "sample",
) {
  let context:
    | {
        processed: number;
        current: { value: ValueT; metadata: MetadataT };
      }
    | undefined;

  return group<ValueT, MetadataT, ValueT, MetadataT, IndexT>(
    dataPipe,
    {
      indexFn: props.indexFn,
      isIndexEqualFn: props.isIndexEqualFn,
      startGroupFn(groupIndex, ctx) {
        context = undefined;
      },
      addItemFn(value, metadata, ctx) {
        if (context === undefined) {
          context = {
            processed: 1,
            current: { value, metadata },
          };
          return;
        }

        context.current = choose(
          context.current,
          { value, metadata },
          props.sampleType,
          context.processed + 1,
        );
        context.processed += 1;
      },
      endGroupFn(error, ctx) {
        if (error !== undefined) {
          return;
        }

        ctx.emitItem(context!.current.value, context!.current.metadata);
      },
    },
    name,
  );
}

function choose<ValueT, MetadataT>(
  prev: { value: ValueT; metadata: MetadataT },
  current: { value: ValueT; metadata: MetadataT },
  sampleType: SampleType<ValueT, MetadataT>,
  currentSize: number,
): { value: ValueT; metadata: MetadataT } {
  switch (sampleType) {
    case "first":
      return prev;
    case "last":
      return current;
    case "random":
      return Math.random() < 1 / currentSize ? current : prev;
    default:
      switch (sampleType.type) {
        case "min":
          return sampleType.valueFn(current.value, current.metadata) <
            sampleType.valueFn(prev.value, prev.metadata)
            ? current
            : prev;
        case "max":
          return sampleType.valueFn(current.value, current.metadata) >
            sampleType.valueFn(prev.value, prev.metadata)
            ? current
            : prev;
        /* istanbul ignore next */
        default: {
          const _missingCase: never = sampleType;
          throw new Error("unknown sampleType");
        }
      }
  }
}
