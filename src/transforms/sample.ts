import { Handler, NormalizedHandler } from "../Handler";
import { withContext } from "../withContext";

export type SampleType<ValueT, MetadataT> =
  | "first"
  | "last"
  | "random"
  | {
      type: "min";
      valueFn: (value: ValueT, metadata: MetadataT) => number;
    }
  | {
      type: "max";
      valueFn: (value: ValueT, metadata: MetadataT) => number;
    };

export function sample<ValueT, MetadataT>(
  sampleType: SampleType<ValueT, MetadataT>,
): NormalizedHandler<ValueT, MetadataT, ValueT, MetadataT> {
  return withContext<
    ValueT,
    MetadataT,
    ValueT,
    MetadataT,
    {
      processed: 0;
      current: { value: ValueT; metadata: MetadataT } | undefined;
    }
  >({
    init(_control) {
      return {
        processed: 0,
        current: undefined,
      };
    },
    onItem(value, metadata, control) {
      control.context.current = choose(
        control.context.current,
        { value, metadata },
        sampleType,
        control.context.processed + 1,
      );
      control.context.processed++;
    },
    onEof(control) {
      if (control.context.current !== undefined) {
        control.emitItem(
          control.context.current.value,
          control.context.current.metadata,
        );
      }
      control.emitEof();
    },
  });
}

function choose<ValueT, MetadataT>(
  prev: { value: ValueT; metadata: MetadataT } | undefined,
  current: { value: ValueT; metadata: MetadataT },
  sampleType: SampleType<ValueT, MetadataT>,
  currentSize: number,
): { value: ValueT; metadata: MetadataT } {
  if (prev === undefined) {
    return current;
  }

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
