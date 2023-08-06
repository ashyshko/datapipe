import { DataPipeBase } from "./DataPipeBase";
import { ITransform } from "./ITransform";
import { TransformMixins } from "./TransformMixins";

export class Chain<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT,
    NewValueT,
    NewMetadataT,
  >
  extends TransformMixins<InValueT, InMetadataT, NewValueT, NewMetadataT>
  implements ITransform<InValueT, InMetadataT, NewValueT, NewMetadataT>
{
  public constructor(
    dataPipe: DataPipeBase,
    public readonly from: ITransform<
      InValueT,
      InMetadataT,
      OutValueT,
      OutMetadataT
    >,
    public readonly to: ITransform<
      OutValueT,
      OutMetadataT,
      NewValueT,
      NewMetadataT
    >,
  ) {
    super(dataPipe);
  }

  public onItem(value: InValueT, metadata: InMetadataT) {
    this.from.onItem(value, metadata);
  }

  public onError(error: Error) {
    this.from.onError(error);
  }

  public onEof() {
    this.from.onEof();
  }

  public async join(): Promise<void> {
    await Promise.all([this.from.join(), this.to.join()]);
  }

  public chain<NextValueT, NextMetadataT>(
    nextReceiver: ITransform<
      NewValueT,
      NewMetadataT,
      NextValueT,
      NextMetadataT
    >,
  ): Chain<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT,
    NextValueT,
    NextMetadataT
  > {
    return new Chain(this.dataPipe, this.from, this.to.chain(nextReceiver));
  }

  public _start() {
    this.from._start();
    this.to._start();
  }

  public _cancel() {
    this.from._cancel();
    this.to._cancel();
  }
}
