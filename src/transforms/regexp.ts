import { NormalizedHandler } from "../Handler";
import { filterMap } from "./filterMap";

export function regexp<MetadataT>(
  re: RegExp,
): NormalizedHandler<string, MetadataT, string[], MetadataT> {
  return filterMap((value, metadata) => {
    const match = value.match(re);
    if (!match) {
      return undefined;
    }

    return { value: [...match], metadata };
  });
}
