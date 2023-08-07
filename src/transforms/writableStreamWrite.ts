import { NormalizedHandler } from "../Handler";
import { asyncHandlerWithContext } from "../asyncHandlerWithContext";

export function writableStreamWrite<T>(
  stream: WritableStream<T>,
): NormalizedHandler<T, unknown, never, never> {
  return asyncHandlerWithContext({
    init(_control) {
      return Promise.resolve(stream.getWriter());
    },
    async onItem(value, _metadata, control) {
      await control.context.ready;
      await control.context.write(value);
    },
    async finalize(_error, _control) {
      await _control.context.close();
    },
  });
}
