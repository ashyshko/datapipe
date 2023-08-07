import { asyncHandler } from "../asyncHandler";

export function readableStreamRead<T, MetadataT>() {
  return asyncHandler<ReadableStream<T>, MetadataT, T, MetadataT>({
    async onItem(readableStream, metadata, ctx) {
      const reader = readableStream.getReader();
      ctx.setCancelFn(() => {
        reader.cancel();
      });

      while (!ctx.isStopped()) {
        const data = await reader.read();

        if (data.done) {
          break;
        }

        ctx.emitItem(data.value, metadata);
      }
    },
  });
}
