import { NormalizedHandler } from "../Handler";
import { withContext } from "../withContext";

export function candleStick<InValueT, InMetadataT>(
  props: number extends InValueT
    ? { valueFn?: (value: InValueT, metadata: InMetadataT) => number }
    : {
        valueFn: (value: InValueT, metadata: InMetadataT) => number;
      },
): NormalizedHandler<
  InValueT,
  InMetadataT,
  {
    first: number;
    min: number;
    max: number;
    last: number;
    sum: number;
    avg: number;
    count: number;
  },
  InMetadataT
> {
  const valueFn = props.valueFn ?? ((value) => value as number);

  let firstMetadata: InMetadataT;

  return withContext({
    init(control) {
      return undefined as
        | {
            first: number;
            min: number;
            max: number;
            last: number;
            sum: number;
            count: number;
          }
        | undefined;
    },
    onItem(inValue, metadata, control) {
      const value = valueFn(inValue, metadata);

      if (firstMetadata === undefined) {
        firstMetadata = metadata;
      }

      if (control.context === undefined) {
        control.context = {
          first: value,
          min: value,
          max: value,
          last: value,
          sum: value,
          count: 1,
        };
      } else {
        control.context.min = Math.min(control.context.min, value);
        control.context.max = Math.max(control.context.max, value);
        control.context.last = value;
        control.context.sum += value;
        control.context.count++;
      }
    },
    onEof(control) {
      if (control.context !== undefined) {
        control.emitItem(
          {
            ...control.context,
            avg: control.context.sum / control.context.count,
          },
          firstMetadata!,
        );
      }
      control.emitEof();
    },
  });
}
