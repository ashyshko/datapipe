import { ControlT } from "./Handler";

type QueueItem<ValueT, MetadataT> =
  | {
      type: "item";
      value: ValueT;
      metadata: MetadataT;
    }
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "eof";
    };

export class Sender<ValueT, MetadataT> implements ControlT<ValueT, MetadataT> {
  public constructor(
    private readonly logger: (msg: string) => void = () => undefined,
  ) {
    // run on next tick to provide ability for all receivers to connect
    Promise.resolve().then(() => {
      /* istanbul ignore next */
      if (this.state.type !== "initializing") {
        // just check for ts
        throw new Error(
          `internal error: state '${this.state.type}' !== 'initializing'`,
        );
      }

      const queue = this.state.queue;
      this.state = {
        type: "working",
        onFinished: this.state.onFinished,
        cancelFn:
          this.state.nextState.type === "working"
            ? this.state.nextState.cancelFn
            : () => undefined,
      };

      queue.forEach((v) => this.emit(v, /*name*/ "queued emit"));
    });
  }

  public join(): Promise<void> {
    return new Promise((resolve, reject) => {
      const onFinished = (error: Error | undefined) => {
        if (error === undefined) {
          resolve();
        } else {
          reject(error);
        }
      };

      switch (this.state.type) {
        case "initializing":
          this.state.onFinished.push(onFinished);
          return;
        case "working":
          this.state.onFinished.push(onFinished);
          return;
        case "finished":
          resolve();
          return;
        case "failed":
          reject(this.state.error);
          return;
        /* istanbul ignore next */
        default: {
          const _missingCase: never = this.state;
          throw new Error("unknown state");
        }
      }
    });
  }

  public emitItem(value: ValueT, metadata: MetadataT): void {
    this.emit(
      {
        type: "item",
        value,
        metadata,
      },
      "emitItem",
    );
  }

  public emitError(error: Error): void {
    this.logger("error emit: " + error.message);
    this.emit(
      {
        type: "error",
        error,
      },
      "emitError",
    );
  }

  public emitEof(): void {
    this.logger("eof emit");
    this.emit(
      {
        type: "eof",
      },
      "emitEof",
    );
  }

  public setCancelFn(cancelFn: () => void): void {
    switch (this.actualState.type) {
      case "working":
        break;
      case "failed":
        cancelFn();
        return;
      case "finished":
        return;
      /* istanbul ignore next */
      default: {
        const _missingCase: never = this.actualState;
        throw new Error("unknown state");
      }
    }

    if (this.state.type === "initializing") {
      /* istanbul ignore next */
      if (this.state.nextState.type !== "working") {
        // just check for ts
        throw new Error(
          `internal error: nextState for initializing '${this.state.type}' !== 'working'`,
        );
      }

      this.state.nextState.cancelFn = cancelFn;
      return;
    }

    /* istanbul ignore next */
    if (this.state.type !== "working") {
      // just check for ts
      throw new Error(
        `internal error: state '${this.state.type}' !== 'working'`,
      );
    }

    this.state.cancelFn = cancelFn;
  }

  public isStopped(): boolean {
    return this.actualState.type !== "working";
  }

  private state:
    | {
        type: "initializing";
        queue: QueueItem<ValueT, MetadataT>[];
        nextState:
          | {
              type: "working";
              cancelFn: () => void;
            }
          | {
              type: "finished";
            }
          | {
              type: "failed";
              error: Error;
            };
        onFinished: Array<(error: Error | undefined) => void>;
      }
    | {
        type: "working";
        cancelFn: () => void;
        onFinished: Array<(error: Error | undefined) => void>;
      }
    | {
        type: "finished";
      }
    | {
        type: "failed";
        error: Error;
      } = {
    type: "initializing",
    queue: [],
    nextState: { type: "working", cancelFn: () => undefined },
    onFinished: [],
  };

  private emit(item: QueueItem<ValueT, MetadataT>, name: string) {
    switch (this.actualState.type) {
      case "working":
        break;
      case "finished":
        throw new Error(`${name} has been called after emitEof`);
      case "failed":
        return; // ignore further notifications
      /* istanbul ignore next */
      default: {
        const _missingCase: never = this.actualState;
        throw new Error("unknown state");
      }
    }

    if (this.state.type === "initializing") {
      this.state.queue.push(item);

      if (this.state.nextState.type === "working") {
        if (item.type === "error") {
          const cancelFn = this.state.nextState.cancelFn;
          this.state.nextState = {
            type: "failed",
            error: item.error,
          };
          try {
            cancelFn();
          } catch (_e) {}
        } else if (item.type === "eof") {
          this.state.nextState = {
            type: "finished",
          };
        }
      }

      return;
    }

    /* istanbul ignore next */
    if (this.state.type !== "working") {
      // just check for ts
      throw new Error(
        `internal error: state '${this.state.type}' !== 'working'`,
      );
    }

    switch (item.type) {
      case "item":
        this.receivers.forEach((v) => v.onItem(item.value, item.metadata));
        break;

      case "error": {
        const onFinishedCallbacks = this.state.onFinished;
        const cancelFn = this.state.cancelFn;
        this.state = {
          type: "failed",
          error: item.error,
        };
        this.receivers.forEach((v) => v.onError(item.error));
        onFinishedCallbacks.forEach((v) => v(item.error));
        try {
          cancelFn();
        } catch (_e) {}
        break;
      }

      case "eof": {
        const onFinishedCallbacks = this.state.onFinished;
        this.state = {
          type: "finished",
        };
        this.receivers.forEach((v) => v.onEof());
        onFinishedCallbacks.forEach((v) => v(/*error*/ undefined));
      }
    }
  }

  private receivers: Array<{
    onItem(value: ValueT, metadata: MetadataT): void;
    onError(error: Error): void;
    onEof(): void;
  }> = [];

  private get actualState():
    | { type: "working" }
    | { type: "finished" }
    | { type: "failed"; error: Error } {
    switch (this.state.type) {
      case "initializing":
        return this.state.nextState;
      default:
        return this.state;
    }
  }

  public connect(callbackFn: Sender<ValueT, MetadataT>["receivers"][0]): this {
    if (this.state.type !== "initializing") {
      throw new Error("connect has been called after initialization");
    }

    this.receivers.push(callbackFn);
    return this;
  }
}
