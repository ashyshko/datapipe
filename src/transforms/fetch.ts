import { DataPipeBase } from "../DataPipeBase";
import { transform } from "../transformFn";
import { readableStreamRead } from "./readableStreamRead";

export function fetch<MetadataT>(dataPipe: DataPipeBase, name = "fetch") {
  return transform<
    {
      input: Parameters<typeof global.fetch>[0];
      init: Parameters<typeof global.fetch>[1];
    },
    MetadataT,
    ReadableStream<Uint8Array>,
    MetadataT & { fetchInput: Parameters<typeof global.fetch>[0] }
  >(
    dataPipe,
    {
      async processItem(value, metadata, ctx) {
        const fetchRes = await global.fetch(value.input, value.init);

        if (!fetchRes.ok) {
          throw new Error(
            `fetch failed with HTTP error ${fetchRes.status}: ${fetchRes.statusText}`,
          );
        }

        if (fetchRes.body === null) {
          throw new Error(`no body provided in response`);
        }

        ctx.emitItem(fetchRes.body, { ...metadata, fetchInput: value.input });
      },
    },
    name,
  ).chain(readableStreamRead(dataPipe, `${name}.readableStreamRead`));
}
