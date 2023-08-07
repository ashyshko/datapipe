import { ControlT, NormalizedHandler } from "./Handler";
import { asyncHandlerWithContext } from "./asyncHandlerWithContext";

export function asyncHandler<InValueT, InMetadataT, OutValueT, OutMetadataT>(
  handler: {
    init?(control: ControlT<OutValueT, OutMetadataT>): Promise<void>;

    onItem(
      value: InValueT,
      metadata: InMetadataT,
      control: ControlT<OutValueT, OutMetadataT>,
    ): Promise<void>;
  } & (
    | {
        onError?(
          error: Error,
          control: ControlT<OutValueT, OutMetadataT>,
        ): Promise<void>;
        onEof?(control: ControlT<OutValueT, OutMetadataT>): Promise<void>;
        finalize?: undefined;
      }
    | {
        onError?: undefined;
        onEof?: undefined;
        finalize?(
          error: Error | undefined,
          control: ControlT<OutValueT, OutMetadataT>,
        ): Promise<void>;
      }
  ),
): NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  return asyncHandlerWithContext<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT,
    undefined
  >({
    async init(control) {
      await handler.init?.(control);
      return undefined;
    },
    onItem: handler.onItem,
    async onError(error, control) {
      if (handler.onError !== undefined) {
        await handler.onError(error, control);
      } else {
        await handler.finalize?.(error, control);
        control.emitError(error);
      }
    },
    async onEof(control) {
      if (handler.onEof !== undefined) {
        await handler.onEof(control);
      } else {
        await handler.finalize?.(/*error*/ undefined, control);
        control.emitEof();
      }
    },
  });
}
