import { NormalizedHandler, normalize } from "../Handler";

export function limit<ValueT, MetadataT>(
  maxItems: number,
): NormalizedHandler<ValueT, MetadataT, ValueT, MetadataT> {
  if (maxItems < 1) {
    throw new Error("incorrect maxItems value");
  }

  let state:
    | {
        type: "idle";
      }
    | {
        type: "emitting";
        left: number;
      }
    | {
        type: "finished";
      } = { type: "idle" };

  return normalize({
    onItem(value, metadata, control) {
      switch (state.type) {
        case "idle":
          state = {
            type: "emitting",
            left: maxItems,
          };
        // fallthrough
        case "emitting":
          control.emitItem(value, metadata);
          state.left--;
          if (state.left <= 0) {
            state = { type: "finished" };
            control.emitEof();
          }
          break;
        case "finished":
          break;
        /*istanbul ignore next*/
        default: {
          const _missingCase: never = state;
          throw new Error("unknown state");
        }
      }
    },
    onError(error, control) {
      switch (state.type) {
        case "idle":
        // fallthrough
        case "emitting":
          // just for consistency
          state = { type: "finished" };
          control.emitError(error);
          break;
        case "finished":
          // do nothing - eof has been already emitted
          break;
        /*istanbul ignore next*/
        default: {
          const _missingCase: never = state;
          throw new Error("unknown state");
        }
      }
    },
    onEof(control) {
      switch (state.type) {
        case "idle":
          control.emitEof();
          break;
        case "emitting":
          // just for consistency
          state = { type: "finished" };
          control.emitEof();
          break;
        case "finished":
          // do nothing - eof has been already emitted
          break;
        /*istanbul ignore next*/
        default: {
          const _missingCase: never = state;
          throw new Error("unknown state");
        }
      }
    },
  });
}
