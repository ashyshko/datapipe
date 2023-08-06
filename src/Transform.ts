import { Chain } from "./Chain";
import { DataPipeBase } from "./DataPipeBase";
import { ITransform } from "./ITransform";
import { TransformMixins } from "./TransformMixins";

export class Canceled extends Error {
  public constructor() {
    super("Canceled");
    this.name = "Canceled";
  }
}

type QueueItem<InValueT, InMetadataT> =
  | {
      type: "item";
      value: InValueT;
      metadata: InMetadataT;
    }
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "eof";
    };

export abstract class Transform<InValueT, InMetadataT, OutValueT, OutMetadataT>
  extends TransformMixins<InValueT, InMetadataT, OutValueT, OutMetadataT>
  implements ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT>
{
  protected state:
    | { type: "init" }
    | {
        type: "idle";
        onFinished: Array<(e: Error | undefined) => void>;
      }
    | {
        type: "processing";
        queue: QueueItem<InValueT, InMetadataT>[];
        onFinished: Array<(e: Error | undefined) => void>;
      }
    | { type: "failed"; error: Error }
    | { type: "finished" } = { type: "init" };

  protected cancelFn: () => void = () => undefined;

  private receivers: ITransform<OutValueT, OutMetadataT, any, any>[] = [];

  public constructor(
    dataPipe: DataPipeBase,
    public readonly name = "Transform",
  ) {
    super(dataPipe);
    this.dataPipe._registerTransform(this);
  }

  // called by DataPipe, shouldn't be called manually
  public _start(): void {
    try {
      if (this.state.type !== "init") {
        throw new Error(`${this.name}._start() has been called twice.`);
      }

      this.state = {
        type: "idle",
        onFinished: [],
      };
    } catch (e) {
      this.onFailed(e);
      throw e;
    }
  }

  // called by DataPipe, shouldn't be called manually
  public _cancel(): void {
    try {
      switch (this.state.type) {
        case "init":
          throw new Error(
            `${this.name}.cancel() cannot be called prior to calling DataPipe.start().`,
          );
        case "idle":
        // fallthrough
        case "processing":
          break;
        case "failed":
          return;
        case "finished":
          return;
        /* istanbul ignore next */
        default: {
          const _missingCase: never = this.state;
          throw new Error("unknown state");
        }
      }

      this.onFailed(new Canceled());
    } catch (e) {
      this.onFailed(e);
      throw e;
    }
  }

  public join(): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (e: Error) => void) => {
        switch (this.state.type) {
          case "init":
            reject(
              new Error(
                `The method ${this.name}.join() cannot be called prior to calling DataPipe.start().`,
              ),
            );
            return;

          case "idle":
          // fallthrough
          case "processing":
            this.state.onFinished.push((e: Error | undefined) => {
              if (e === undefined) {
                resolve();
              } else {
                reject(e);
              }
            });
            break;

          case "finished":
            resolve();
            break;

          case "failed":
            reject(this.state.error);
            break;

          /* istanbul ignore next */
          default: {
            const _missingCase: never = this.state;
            reject(new Error("unknown state"));
          }
        }
      },
    );
  }

  public onItem(value: InValueT, metadata: InMetadataT): void {
    this.addItem(
      {
        type: "item",
        value,
        metadata,
      },
      "onItem",
    );
  }

  public onError(error: Error): void {
    this.addItem(
      {
        type: "error",
        error,
      },
      "onError",
    );
  }

  public onEof(): void {
    this.addItem(
      {
        type: "eof",
      },
      "onEof",
    );
  }

  public chain<NewValueT, NewMetadataT>(
    receiver: ITransform<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
  ): Chain<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT,
    NewValueT,
    NewMetadataT
  > {
    if (this.state.type !== "init") {
      throw new Error(
        `${this.name}.chain() cannot be added after invoking DataPipe.start(). It could be done only in 'init' state.`,
      );
    }

    this.receivers.push(receiver);

    return new Chain<
      InValueT,
      InMetadataT,
      OutValueT,
      OutMetadataT,
      NewValueT,
      NewMetadataT
    >(this.dataPipe, this, receiver);
  }

  protected setCancelFn(cancelFn: () => void): void {
    this.cancelFn = cancelFn;
  }

  protected abstract processItem(
    value: InValueT,
    metadata: InMetadataT,
  ): void | Promise<void>;

  protected processError(error: Error): void | Promise<void> {
    const finalize = this.finalize(error);
    if (finalize === undefined) {
      this.emitError(error);
    } else {
      return finalize.then(() => {
        this.emitError(error);
      });
    }
  }

  protected processEof(): void | Promise<void> {
    const finalize = this.finalize(/*error*/ undefined);
    if (finalize === undefined) {
      this.emitEof();
    } else {
      return finalize.then(() => {
        this.emitEof();
      });
    }
  }

  protected finalize(_error: Error | undefined): void | Promise<void> {}

  private addItem(item: QueueItem<InValueT, InMetadataT>, methodName: string) {
    try {
      switch (this.state.type) {
        case "init":
          throw new Error(
            `The method ${this.name}.${methodName}() cannot be called prior to calling DataPipe.start().`,
          );

        case "idle":
          this.state = {
            type: "processing",
            queue: [item],
            onFinished: this.state.onFinished,
          };
          this.startProcessing();
          break;

        case "processing":
          this.state.queue.push(item);
          break;

        case "finished":
          throw new Error(
            `The method ${this.name}.${methodName}() cannot be called after eof.`,
          );

        case "failed":
          if (item.type === "item") {
            throw new Error(
              `${this.name}.${methodName}() has been called in failed state`,
            ); // to support fail-fast strategy
          }

          return; // do nothing, ignore items after error

        /* istanbul ignore next */
        default: {
          const _missingCase: never = this.state;
          throw new Error("unknown state");
        }
      }
    } catch (e) {
      this.onFailed(e);
      throw e;
    }
  }

  private startProcessing() {
    for (;;) {
      if (this.state.type !== "processing") {
        return;
      }

      if (this.state.queue.length < 1) {
        this.state = {
          type: "idle",
          onFinished: this.state.onFinished,
        };
        return;
      }

      const item = this.state.queue.shift()!;

      const res = (() => {
        try {
          switch (item.type) {
            case "item":
              return this.processItem(item.value, item.metadata);
            case "error":
              return this.processError(item.error);
            case "eof":
              return this.processEof();
            /* istanbul ignore next */
            default: {
              const _missingCase: never = item;
              throw new Error("unknown item type");
            }
          }
        } catch (e) {
          /* istanbul ignore next */
          const error = e instanceof Error ? e : new Error("unknown error");

          this.emitError(error);
          throw e;
        }
      })();

      if (res !== undefined) {
        res
          .catch((e) => {
            /* istanbul ignore next */
            const error = e instanceof Error ? e : new Error("unknown error");

            this.emitError(error);
          })
          .then(() => this.startProcessing())
          .catch(() => undefined);
        return;
      }
    }
  }

  private onFailed(e: unknown) {
    if (this.state.type !== "idle" && this.state.type !== "processing") {
      return;
    }

    /* istanbul ignore next */
    const error = e instanceof Error ? e : new Error("unknown error");

    this.emitError(error);
  }

  protected emitItem(value: OutValueT, metadata: OutMetadataT): void {
    switch (this.state.type) {
      case "init":
        throw new Error(
          `${this.name}.emitItem() cannot be called before the DataPipe.start() method.`,
        );

      case "idle":
        break;

      case "processing":
        break;

      case "finished":
        throw new Error(`${this.name}.emitItem() cannot be called after eof.`);

      case "failed":
        return; // do nothing, ignore items after error

      /* istanbul ignore next */
      default: {
        const _missingCase: never = this.state;
        throw new Error("unknown state");
      }
    }

    this.receivers.forEach((recv) => recv.onItem(value, metadata));
  }

  protected emitError(e: Error): void {
    switch (this.state.type) {
      case "init":
        throw new Error(
          `${this.name}.emitError() cannot be called before the DataPipe.start() method.`,
        );

      case "idle":
        break;

      case "processing":
        break;

      case "finished":
        throw new Error(`${this.name}.emitError() cannot be called after eof.`);

      case "failed":
        return; // do nothing, ignore next error

      /* istanbul ignore next */
      default: {
        const _missingCase: never = this.state;
        throw new Error("unknown state");
      }
    }

    const callbacks = this.state.onFinished;

    this.state = {
      type: "failed",
      error: e,
    };

    this.receivers.forEach((recv) => recv.onError(e));
    callbacks.forEach((cb) => cb(e));
    try {
      this.cancelFn();
    } catch (_e) {}
  }

  protected emitEof(): void {
    switch (this.state.type) {
      case "init":
        throw new Error(
          `${this.name}.emitEof() cannot be called before the DataPipe.start() method.`,
        );

      case "idle":
        break;

      case "processing":
        break;

      case "finished":
        throw new Error(`${this.name}.emitError() called twice.`);

      case "failed":
        return; // do nothing, ignore eof after error

      /* istanbul ignore next */
      default: {
        const _missingCase: never = this.state;
        throw new Error("unexpected state");
      }
    }

    const callbacks = this.state.onFinished;

    this.state = {
      type: "finished",
    };

    this.receivers.forEach((recv) => recv.onEof());
    callbacks.forEach((cb) => cb(/*error*/ undefined));
  }
}
