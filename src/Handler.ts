export type ControlT<OutValueT, OutMetadataT> = {
  emitItem(value: OutValueT, metadata: OutMetadataT): void;
  emitError(error: Error): void;
  emitEof(): void;

  setCancelFn(cancelFn: () => void): void;
  isStopped(): boolean;
};

export interface NormalizedHandler<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
> {
  init?(control: ControlT<OutValueT, OutMetadataT>): void;
  onItem(
    value: InValueT,
    metadata: InMetadataT,
    control: ControlT<OutValueT, OutMetadataT>,
  ): void;
  onError(error: Error, control: ControlT<OutValueT, OutMetadataT>): void;
  onEof(control: ControlT<OutValueT, OutMetadataT>): void;
}

export type Handler<InValueT, InMetadataT, OutValueT, OutMetadataT> =
  | NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT>
  | ({
      init?(control: ControlT<OutValueT, OutMetadataT>): void;

      onItem(
        value: InValueT,
        metadata: InMetadataT,
        control: ControlT<OutValueT, OutMetadataT>,
      ): void;
    } & (
      | {
          onError?(
            error: Error,
            control: ControlT<OutValueT, OutMetadataT>,
          ): void;
          onEof?(control: ControlT<OutValueT, OutMetadataT>): void;
          finalize?: undefined;
        }
      | {
          onError?: undefined;
          onEof?: undefined;
          finalize?(
            error: Error | undefined,
            control: ControlT<OutValueT, OutMetadataT>,
          ): void;
        }
    ));

export function normalize<InValueT, InMetadataT, OutValueT, OutMetadataT>(
  handler: Handler<InValueT, InMetadataT, OutValueT, OutMetadataT>,
): NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  // @ts-expect-error: prohibited by type deduction, just check for safety
  if (handler.onError !== undefined && handler.finalize !== undefined) {
    throw new Error(
      "Both onError and finalize are provided to normalize function",
    );
  }

  // @ts-expect-error: prohibited by type deduction, just check for safety
  if (handler.onEof !== undefined && handler.finalize !== undefined) {
    throw new Error(
      "Both onEof and finalize are provided to normalize function",
    );
  }

  return {
    init: handler.init,
    onItem: handler.onItem,
    onError(error, control) {
      if (handler.onError !== undefined) {
        handler.onError(error, control);
      } else {
        handler.finalize?.(error, control);
        control.emitError(error);
      }
    },
    onEof(control) {
      if (handler.onEof !== undefined) {
        handler.onEof(control);
      } else {
        handler.finalize?.(/*error*/ undefined, control);
        control.emitEof();
      }
    },
  };
}
