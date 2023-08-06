import { DataPipeBase } from "../DataPipeBase";
import { transform } from "../transformFn";

export function readableStreamRead<T, MetadataT>(
  dataPipe: DataPipeBase,
  name = "readableStreamRead",
) {
  return transform<ReadableStream<T>, MetadataT, T, MetadataT>(
    dataPipe,
    {
      async processItem(readableStream, metadata, ctx) {
        const reader = readableStream.getReader();
        ctx.setCancelFn(() => {
          reader.cancel();
        });

        while (!ctx.isStopped()) {
          try {
            const data = await reader.read();

            if (data.done) {
              break;
            }

            ctx.emitItem(data.value, metadata);
          } catch (e) {
            /* istanbul ignore next */
            const error = e instanceof Error ? e : new Error("unknown error");
            ctx.emitError(error);
            break;
          }
        }
      },
    },
    name,
  );
}
