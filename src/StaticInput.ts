import { DataPipeBase } from "./DataPipeBase";
import { transform } from "./transformFn";

export function staticInput<ValueT>(
  dataPipe: DataPipeBase,
  data: ValueT[],
  name = "staticInput",
) {
  return transform<
    never,
    never,
    ValueT,
    { index: number; total: number; progress: number }
  >(dataPipe, {
    onStarted(ctx) {
      // ensure that all receivers started prior sending items
      setTimeout(() => {
        data.forEach((v, index) =>
          ctx.emitItem(v, {
            index,
            total: data.length,
            progress: index / data.length,
          }),
        );

        ctx.emitEof();
      }, 0);
    },
    processItem(value, metadata, ctx) {
      throw new Error("onItem method has been called for staticInput");
    },
    processError(error, ctx) {
      throw new Error("onError method has been called for staticInput");
    },
    processEof(ctx) {
      throw new Error("onEof method has been called for staticInput");
    },
  });
}
