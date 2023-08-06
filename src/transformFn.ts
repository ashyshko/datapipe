import { DataPipeBase } from "./DataPipeBase";
import { Transform } from "./Transform";
import { ContextT } from "./ITransform";

export function transform<InValueT, InMetadataT, OutValueT, OutMetadataT>(
  dataPipe: DataPipeBase,
  props: {
    onStarted?(ctx: ContextT<OutValueT, OutMetadataT>): void;
    processItem(
      value: InValueT,
      metadata: InMetadataT,
      ctx: ContextT<OutValueT, OutMetadataT>,
    ): void | Promise<void>;
  } & (
    | {
        processError?(
          error: Error,
          ctx: ContextT<OutValueT, OutMetadataT>,
        ): void | Promise<void>;
        processEof?(
          ctx: ContextT<OutValueT, OutMetadataT>,
        ): void | Promise<void>;
        finalize?: undefined;
      }
    | {
        processError?: undefined;
        processEof?: undefined;
        finalize?(
          error: Error | undefined,
          ctx: ContextT<OutValueT, OutMetadataT>,
        ): void | Promise<void>;
      }
  ),
  name = "transform",
): Transform<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  class CustomTransform extends Transform<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT
  > {
    private context: ContextT<OutValueT, OutMetadataT>;

    public constructor() {
      super(dataPipe, name);
      this.context = {
        emitItem: (value: OutValueT, metadata: OutMetadataT) => {
          this.emitItem(value, metadata);
        },
        emitError: (e: Error) => {
          this.emitError(e);
        },
        emitEof: () => {
          this.emitEof();
        },
        setCancelFn: (cancelFn: () => void) => {
          this.setCancelFn(cancelFn);
        },
        isStopped: () => {
          return this.state.type === "finished" || this.state.type === "failed";
        },
      };
    }

    public _start() {
      super._start();
      props.onStarted?.(this.context);
    }

    protected override processItem(
      value: InValueT,
      metadata: InMetadataT,
    ): void | Promise<void> {
      return props.processItem(value, metadata, this.context);
    }

    protected override finalize(error: Error): void | Promise<void> {
      return props.finalize?.(error, this.context);
    }

    protected override processError(e: Error): void | Promise<void> {
      if (props.processError !== undefined) {
        return props.processError(e, this.context);
      } else {
        return super.processError(e);
      }
    }

    protected override processEof(): void | Promise<void> {
      if (props.processEof !== undefined) {
        return props.processEof(this.context);
      } else {
        return super.processEof();
      }
    }
  }

  return new CustomTransform();
}
