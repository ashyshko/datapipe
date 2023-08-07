import { ControlT, Handler, NormalizedHandler } from "./Handler";

export type ControlWithContextT<OutValueT, OutMetadataT, ContextT> = ControlT<
  OutValueT,
  OutMetadataT
> & {
  context: ContextT;
};

export type HandlerWithContext<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
  ContextT,
> = {
  init(control: ControlT<OutValueT, OutMetadataT>): ContextT;

  onItem(
    value: InValueT,
    metadata: InMetadataT,
    control: ControlWithContextT<OutValueT, OutMetadataT, ContextT>,
  ): void;
} & (
  | {
      onError?(
        error: Error,
        control: ControlWithContextT<OutValueT, OutMetadataT, ContextT>,
      ): void;
      onEof?(
        control: ControlWithContextT<OutValueT, OutMetadataT, ContextT>,
      ): void;
      finalize?: undefined;
    }
  | {
      onError?: undefined;
      onEof?: undefined;
      finalize?(
        error: Error | undefined,
        control: ControlWithContextT<OutValueT, OutMetadataT, ContextT>,
      ): void;
    }
);

export function withContext<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
  ContextT,
>(
  handler: HandlerWithContext<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT,
    ContextT
  >,
): NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  let controlWithContext: ControlWithContextT<
    OutValueT,
    OutMetadataT,
    ContextT
  >;
  if (handler.onError !== undefined && handler.finalize !== undefined) {
    throw new Error(
      "Both onError and finalize are provided to withContext function",
    );
  }

  if (handler.onEof !== undefined && handler.finalize !== undefined) {
    throw new Error(
      "Both onEof and finalize are provided to withContext function",
    );
  }

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

      newControl.context = handler.init(newControl);
      controlWithContext = newControl as ControlWithContextT<
        OutValueT,
        OutMetadataT,
        ContextT
      >;
    },
    onItem(value, metadata) {
      handler.onItem(value, metadata, controlWithContext);
    },
    onError(error, control) {
      if (handler.onError !== undefined) {
        handler.onError(error, controlWithContext);
      } else {
        handler.finalize?.(error, controlWithContext);
        control.emitError(error);
      }
    },
    onEof(control) {
      if (handler.onEof !== undefined) {
        handler.onEof(controlWithContext);
      } else {
        handler.finalize?.(/*error*/ undefined, controlWithContext);
        control.emitEof();
      }
    },
  };
}
