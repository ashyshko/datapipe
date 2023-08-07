import { asyncHandler } from "../asyncHandler";
import { pipe } from "../pipe";
import { readableStreamRead } from "./readableStreamRead";

export function fetch<MetadataT>() {
  return pipe(
    asyncHandler<
      {
        input: Parameters<typeof global.fetch>[0];
        init: Parameters<typeof global.fetch>[1];
      },
      MetadataT,
      ReadableStream<Uint8Array>,
      MetadataT & { fetchInput: Parameters<typeof global.fetch>[0] }
    >({
      async onItem(value, metadata, control) {
        const fetchRes = await global.fetch(value.input, value.init);

        if (!fetchRes.ok) {
          throw new Error(
            `fetch failed with HTTP error ${fetchRes.status}: ${fetchRes.statusText}`,
          );
        }

        if (fetchRes.body === null) {
          throw new Error(`no body provided in response`);
        }

        control.emitItem(fetchRes.body, {
          ...metadata,
          fetchInput: value.input,
        });
      },
    }),
    readableStreamRead<
      Uint8Array,
      MetadataT & { fetchInput: Parameters<typeof global.fetch>[0] }
    >(),
  );
}
