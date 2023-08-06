import { DataPipeBase } from "../DataPipeBase";
import { ITransform } from "../ITransform";

export function splitString<MetadataT, IndexT>(
  dataPipe: DataPipeBase,
  props: {
    separator: string | RegExp;
    streamIndexFn?: (value: Uint8Array, metadata: MetadataT) => IndexT;
    isStreamIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
  },
  name = "splitString",
): ITransform<string, MetadataT, string, MetadataT> {
  return;
}
