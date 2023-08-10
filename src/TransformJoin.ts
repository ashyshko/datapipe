import { DataPipe } from "./DataPipe";
import { Handler } from "./Handler";
import { Sender } from "./Sender";
import { Transform, TransformBase, TransformChain } from "./Transform";

export class TransformJoin<OutValueT, OutMetadataT> extends TransformBase<
  never,
  never,
  OutValueT,
  { originalMetadata: OutMetadataT; sourceIndex: number }
> {
  protected sender: Sender<
    OutValueT,
    { originalMetadata: OutMetadataT; sourceIndex: number }
  > = new Sender();

  public constructor(
    dataPipe: DataPipe,
    public readonly transforms: Array<
      TransformBase<unknown, unknown, OutValueT, OutMetadataT>
    >,
    name: string | null = "TransformJoin",
  ) {
    super(dataPipe, name);

    let finished = false;
    const handlerFinished = transforms.map((v) => false);

    transforms.forEach((v, sourceIndex) => {
      v.chain({
        onItem: (value, metadata) => {
          if (finished) {
            // possible if error happened before
            return;
          }

          this.sender.emitItem(value, {
            originalMetadata: metadata,
            sourceIndex,
          });
        },
        onError: (error) => {
          finished = true;
          this.sender.emitError(error);
        },
        onEof: () => {
          handlerFinished[sourceIndex] = true;
          if (finished) {
            // possible if error happened before
            return;
          }

          finished = handlerFinished.indexOf(false) < 0;
          if (finished) {
            this.sender.emitEof();
          }
        },
      });
    });

    if (transforms.length === 0) {
      // no handlers provided
      this.sender.emitEof();
    }
  }

  public join(): Promise<void> {
    return this.sender.join();
  }

  public onItem(value: never, metadata: never): void {
    throw new Error("onItem called for TransformJoin");
  }

  public onError(error: Error): void {
    throw new Error("onError called for TransformJoin");
  }

  public onEof(): void {
    throw new Error("onEof called for TransformJoin");
  }

  public chain<NewValueT, NewMetadataT>(
    handler: Handler<
      OutValueT,
      { originalMetadata: OutMetadataT; sourceIndex: number },
      NewValueT,
      NewMetadataT
    >,
    name?: string | null | undefined,
  ): TransformBase<never, never, NewValueT, NewMetadataT>;
  public chain<NewValueT, NewMetadataT>(
    receiver: TransformBase<
      OutValueT,
      { originalMetadata: OutMetadataT; sourceIndex: number },
      NewValueT,
      NewMetadataT
    >,
  ): TransformBase<never, never, NewValueT, NewMetadataT>;
  public chain<NewValueT, NewMetadataT>(
    handler:
      | Handler<
          OutValueT,
          { originalMetadata: OutMetadataT; sourceIndex: number },
          NewValueT,
          NewMetadataT
        >
      | TransformBase<
          OutValueT,
          { originalMetadata: OutMetadataT; sourceIndex: number },
          NewValueT,
          NewMetadataT
        >,
    name?: string | null,
  ): TransformBase<never, never, NewValueT, NewMetadataT> {
    const handlerObj =
      handler instanceof TransformBase
        ? handler
        : new Transform(this.dataPipe, handler, name);
    this.sender.connect(handlerObj);

    return new TransformChain<
      never,
      never,
      OutValueT,
      { originalMetadata: OutMetadataT; sourceIndex: number },
      NewValueT,
      NewMetadataT
    >(
      this.dataPipe,
      this,
      handler as TransformBase<
        OutValueT,
        { originalMetadata: OutMetadataT; sourceIndex: number },
        NewValueT,
        NewMetadataT
      >,
    );
  }
}
