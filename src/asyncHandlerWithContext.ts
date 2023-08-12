import { ControlT, NormalizedHandler } from "./Handler";
import { toError } from "./utils/toError";
import { ControlWithContextT } from "./withContext";

export function asyncHandlerWithContext<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
  ContextT,
>(
  handler: {
    init(control: ControlT<OutValueT, OutMetadataT>): Promise<ContextT>;

    onItem(
      value: InValueT,
      metadata: InMetadataT,
      control: ControlWithContextT<OutValueT, OutMetadataT, ContextT>,
    ): Promise<void>;
  } & (
    | {
        onError?(
          error: Error,
          control: ControlWithContextT<OutValueT, OutMetadataT, ContextT>,
        ): Promise<void>;
        onEof?(
          control: ControlWithContextT<OutValueT, OutMetadataT, ContextT>,
        ): Promise<void>;
        finalize?: undefined;
      }
    | {
        onError?: undefined;
        onEof?: undefined;
        finalize?(
          error: Error | undefined,
          control: ControlWithContextT<OutValueT, OutMetadataT, ContextT>,
        ): Promise<void>;
      }
  ),
): NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  if (handler.onError !== undefined && handler.finalize !== undefined) {
    throw new Error(
      "Both onError and finalize are provided to asyncHandlerWithContext function",
    );
  }

  if (handler.onEof !== undefined && handler.finalize !== undefined) {
    throw new Error(
      "Both onEof and finalize are provided to asyncHandlerWithContext function",
    );
  }

  let controlWithContext: ControlWithContextT<
    OutValueT,
    OutMetadataT,
    ContextT
  >;
  let state:
    | {
        type: "idle";
      }
    | {
        type: "working";
        queue: Array<() => Promise<void>>;
      } = {
    type: "idle",
  };
  const run = async (
    v: () => Promise<void>,
    control: ControlT<OutValueT, OutMetadataT>,
  ) => {
    switch (state.type) {
      case "idle":
        break;
      case "working":
        state.queue.push(v);
        return;
      /* istanbul ignore next */
      default: {
        const _missingCase: never = state;
        throw new Error("unknown state");
      }
    }

    state = {
      type: "working",
      queue: [v],
    };

    while (true) {
      /* istanbul ignore next */
      if (state.type !== "working") {
        // just check for ts
        throw new Error(
          `internal error: state '${
            (state as { type: string }).type
          }' !== 'working'`,
        );
      }

      if (state.queue.length < 1) {
        state = {
          type: "idle",
        };
        return;
      }

      const fn = state.queue.shift()!;
      try {
        await fn();
      } catch (e) {
        control.emitError(toError(e));
      }
    }
  };

  return {
    init(control) {
      const newControl: ControlT<OutValueT, OutMetadataT> & {
        context: ContextT | undefined;
      } = {
        emitItem(value, metadata) {
          return control.emitItem(value, metadata);
        },
        emitError(error) {
          return control.emitError(error);
        },
        emitEof() {
          return control.emitEof();
        },
        isStopped() {
          return control.isStopped();
        },
        setCancelFn(cancelFn) {
          return control.setCancelFn(cancelFn);
        },
        context: undefined,
      };

      controlWithContext = newControl as ControlWithContextT<
        OutValueT,
        OutMetadataT,
        ContextT
      >;
      run(async () => {
        controlWithContext.context = await handler.init(controlWithContext);
      }, control);
    },
    onItem(value, metadata, control) {
      run(() => handler.onItem(value, metadata, controlWithContext), control);
    },
    onError(error, control) {
      run(async () => {
        if (handler.onError !== undefined) {
          await handler.onError(error, controlWithContext);
        } else {
          await handler.finalize?.(error, controlWithContext);
          control.emitError(error);
        }
      }, control);
    },
    onEof(control) {
      run(async () => {
        if (handler.onEof !== undefined) {
          await handler.onEof(controlWithContext);
        } else {
          await handler.finalize?.(/*error*/ undefined, controlWithContext);
          control.emitEof();
        }
      }, control);
    },
  };
}
