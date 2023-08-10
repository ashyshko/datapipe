import { ControlT, Handler, NormalizedHandler } from "./Handler";
import { Sender } from "./Sender";

export class Sequence<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  public constructor(
    public readonly control: ControlT<OutValueT, OutMetadataT>,
  ) {}

  private state:
    | {
        type: "idle";
      }
    | {
        type: "working";
        handler: NormalizedHandler<
          InValueT,
          InMetadataT,
          OutValueT,
          OutMetadataT
        >;
        control: ControlT<OutValueT, OutMetadataT>;
        pending: Array<{
          handler: NormalizedHandler<
            InValueT,
            InMetadataT,
            OutValueT,
            OutMetadataT
          >;
          items: Array<{ value: InValueT; metadata: InMetadataT }>;
        }>;
      }
    | {
        type: "finalizing";
        handler: NormalizedHandler<
          InValueT,
          InMetadataT,
          OutValueT,
          OutMetadataT
        >;
        control: ControlT<OutValueT, OutMetadataT>;
        error: Error | undefined;
      }
    | {
        type: "finished";
      } = { type: "idle" };

  public onItem(
    value: InValueT,
    metadata: InMetadataT,
    handler: NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT>,
  ): void {
    switch (this.state.type) {
      case "idle":
        this.state = {
          type: "working",
          handler,
          control: this.initHandler(handler),
          pending: [],
        };
        handler.onItem(value, metadata, this.state.control);
        break;
      case "working":
        if (this.state.pending.length > 0) {
          if (
            this.state.pending[this.state.pending.length - 1].handler ===
            handler
          ) {
            this.state.pending[this.state.pending.length - 1].items.push({
              value,
              metadata,
            });
            break;
          }

          this.state.pending.push({
            handler,
            items: [{ value, metadata }],
          });
          break;
        }

        if (this.state.handler === handler) {
          this.state.handler.onItem(value, metadata, this.state.control);
          break;
        }

        this.state.pending.push({
          handler,
          items: [{ value, metadata }],
        });
        this.state.handler.onEof(this.state.control);
        break;
      case "finalizing":
        break;
      case "finished":
        break;
      /* istanbul ignore next */
      default: {
        const _missingCase: never = this.state;
        throw new Error("unknown state");
      }
    }
  }

  public onError(error: Error): void {
    switch (this.state.type) {
      case "idle":
        this.control.emitError(error);
        break;
      case "working":
        this.state = {
          type: "finalizing",
          handler: this.state.handler,
          control: this.state.control,
          error,
        };
        this.state.handler.onError(error, this.state.control);
        break;
      case "finalizing":
        break;
      case "finished":
        break;
      /* istanbul ignore next */
      default: {
        const _missingCase: never = this.state;
        throw new Error("unknown state");
      }
    }
  }

  public onEof(): void {
    switch (this.state.type) {
      case "idle":
        this.control.emitEof();
        break;
      case "working":
        this.state = {
          type: "finalizing",
          handler: this.state.handler,
          control: this.state.control,
          error: undefined,
        };
        this.state.handler.onEof(this.state.control);
        break;
      case "finalizing":
        break;
      case "finished":
        break;
      /* istanbul ignore next */
      default: {
        const _missingCase: never = this.state;
        throw new Error("unknown state");
      }
    }
  }

  private initHandler(
    handler: NormalizedHandler<InValueT, InMetadataT, OutValueT, OutMetadataT>,
  ): ControlT<OutValueT, OutMetadataT> {
    const res = new Sender<OutValueT, OutMetadataT>();

    handler.init?.(res);
    res.connect({
      onItem: (value, metadata) => {
        // Sender guarantees that it's impossible, just check for ts
        /* istanbul ignore next */
        if (
          (this.state.type !== "working" && this.state.type !== "finalizing") ||
          this.state.handler !== handler
        ) {
          return;
        }

        this.control.emitItem(value, metadata);
      },
      onError: (error) => {
        // Sender guarantees that it's impossible, just check for ts
        /* istanbul ignore next */
        if (
          (this.state.type !== "working" && this.state.type !== "finalizing") ||
          this.state.handler !== handler
        ) {
          return;
        }

        this.control.emitError(error);

        this.state = {
          type: "finished",
        };
      },
      onEof: () => {
        // Sender guarantees that it's impossible, just check for ts
        /* istanbul ignore next */
        if (
          (this.state.type !== "working" && this.state.type !== "finalizing") ||
          this.state.handler !== handler
        ) {
          return;
        }

        if (this.state.type === "finalizing") {
          if (this.state.error !== undefined) {
            this.control.emitError(this.state.error);
          } else {
            this.control.emitEof();
          }

          this.state = {
            type: "finished",
          };
          return;
        }

        if (this.state.pending.length === 0) {
          this.state = {
            type: "idle",
          };
          return;
        }

        const obj = this.state.pending.shift()!;
        const control = this.initHandler(obj.handler);
        this.state = {
          type: "working",
          handler: obj.handler,
          control,
          pending: this.state.pending,
        };
        obj.items.forEach((v) =>
          obj.handler.onItem(v.value, v.metadata, control),
        );
        if (this.state.pending.length > 0) {
          obj.handler.onEof(control);
        }
      },
    });
    return res;
  }
}
