import { DataPipeBase } from "../DataPipeBase";
import { ContextT, ITransform } from "../ITransform";
import { transform } from "../transformFn";
import { group } from "./group";

export function textDecoder<MetadataT, IndexT = number>(
  dataPipe: DataPipeBase,
  props: {
    label?: string;
    options?: ConstructorParameters<typeof TextDecoder>[1];
    streamIndexFn?: (value: Uint8Array, metadata: MetadataT) => IndexT;
    isStreamIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
  },
  name = "textDecoder",
): ITransform<
  Uint8Array,
  MetadataT,
  string,
  MetadataT & { streamIndex: IndexT; leftOvers: boolean }
> {
  let context: { decoder: TextDecoder; metadata: MetadataT } | undefined;
  let streamIndex: IndexT | undefined;

  if (
    props.isStreamIndexEqualFn !== undefined &&
    props.streamIndexFn === undefined
  ) {
    throw new Error(
      "textDecoder isStreamIndexEqualFn is defined without streamIndexFn",
    );
  }

  return group<
    Uint8Array,
    MetadataT,
    string,
    MetadataT & { streamIndex: IndexT; leftOvers: boolean },
    IndexT | undefined
  >(
    dataPipe,
    {
      indexFn: props.streamIndexFn ?? (() => undefined),
      isIndexEqualFn: (l, r) => {
        if (props.streamIndexFn === undefined) {
          return true;
        }

        return props.isStreamIndexEqualFn?.(l!, r!) ?? l === r;
      },
      startGroupFn: (index) => {
        context = undefined;
        streamIndex = index;
      },
      addItemFn: (value, metadata, ctx) => {
        if (context === undefined) {
          context = {
            decoder: new TextDecoder(props.label, props.options),
            metadata: metadata,
          };
        }

        const chunk = context.decoder.decode(value, { stream: true });
        if (chunk.length > 0) {
          ctx.emitItem(chunk, {
            ...metadata,
            streamIndex: streamIndex!,
            leftOvers: false,
          });
        }
      },
      endGroupFn(error, ctx) {
        if (error !== undefined) {
          return;
        }

        const leftOvers = context!.decoder.decode(undefined, { stream: false });
        if (leftOvers.length > 0) {
          ctx.emitItem(leftOvers, {
            ...context!.metadata,
            streamIndex: streamIndex!,
            leftOvers: true,
          });
        }
      },
    },
    name,
  );
}
