import { DataPipe } from "./DataPipe";
import { Sender } from "./Sender";
import { NormalizedHandler, Handler, normalize } from "./Handler";
import { group } from "./group";
import { filterMap } from "./transforms/filterMap";

export abstract class TransformBase<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
> {
  public constructor(
    public readonly dataPipe: DataPipe,
    public readonly name: string | null = "Transform",
  ) {
    if (this.name) {
      this.dataPipe._registerTransform(this);
    }
  }

  public abstract join(): Promise<void>;

  public abstract onItem(value: InValueT, metadata: InMetadataT): void;

  public abstract onError(error: Error): void;

  public abstract onEof(): void;

  public abstract chain<NewValueT, NewMetadataT>(
    handler: Handler<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
    name?: string | null,
  ): TransformBase<InValueT, InMetadataT, NewValueT, NewMetadataT>;
  public abstract chain<NewValueT, NewMetadataT>(
    receiver: TransformBase<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
  ): TransformBase<InValueT, InMetadataT, NewValueT, NewMetadataT>;

  public filter(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => boolean,
    name = "filter",
  ) {
    return this.chain(
      filterMap((value, metadata) => {
        if (callbackFn(value, metadata)) {
          return { value, metadata };
        }
      }),
      name,
    );
  }

  public map<NewValueT, NewMetadataT>(
    callbackFn: (
      value: OutValueT,
      metadata: OutMetadataT,
    ) => { value: NewValueT; metadata: NewMetadataT },
    name = "map",
  ) {
    return this.chain(
      filterMap((value, metadata) => {
        const mapped = callbackFn(value, metadata);
        return { value: mapped.value, metadata: mapped.metadata };
      }),
      name,
    );
  }

  public mapValue<NewValueT>(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => NewValueT,
    name = "mapValue",
  ) {
    return this.chain(
      filterMap((value, metadata) => {
        const mappedValue = callbackFn(value, metadata);
        return { value: mappedValue, metadata };
      }),
      name,
    );
  }

  public mapMetadata<NewMetadataT>(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => NewMetadataT,
    name = "mapMetadata",
  ) {
    return this.chain(
      filterMap((value, metadata) => {
        const mappedMetadata = callbackFn(value, metadata);
        return { value, metadata: mappedMetadata };
      }),
      name,
    );
  }

  public group<NewValueT, NewMetadataT, IndexT>(
    handle: Parameters<
      typeof group<OutValueT, OutMetadataT, NewValueT, NewMetadataT, IndexT>
    >[0],
    name = "group",
  ) {
    return this.chain<NewValueT, NewMetadataT>(group(handle), name);
  }
}

export class Transform<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
> extends TransformBase<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  private readonly handler: NormalizedHandler<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT
  >;
  private sender = new Sender<OutValueT, OutMetadataT>();

  public constructor(
    dataPipe: DataPipe,
    handler: Handler<InValueT, InMetadataT, OutValueT, OutMetadataT>,
    name?: string | null,
  ) {
    super(dataPipe, name);
    this.handler = normalize(handler);
    this.handler.init?.(this.sender);
  }

  public join(): Promise<void> {
    return this.sender.join();
  }

  public onItem(value: InValueT, metadata: InMetadataT): void {
    this.handler.onItem(value, metadata, this.sender);
  }

  public onError(error: Error): void {
    this.handler.onError(error, this.sender);
  }

  public onEof(): void {
    this.handler.onEof(this.sender);
  }

  public chain<NewValueT, NewMetadataT>(
    handler: Handler<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
    name?: string | null,
  ): TransformBase<InValueT, InMetadataT, NewValueT, NewMetadataT>;
  public chain<NewValueT, NewMetadataT>(
    receiver: TransformBase<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
  ): TransformBase<InValueT, InMetadataT, NewValueT, NewMetadataT>;
  public chain<NewValueT, NewMetadataT>(
    receiver:
      | TransformBase<OutValueT, OutMetadataT, NewValueT, NewMetadataT>
      | Handler<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
    name?: string | null,
  ): TransformBase<InValueT, InMetadataT, NewValueT, NewMetadataT> {
    const receiverTransform =
      receiver instanceof TransformBase
        ? receiver
        : new Transform(this.dataPipe, receiver, name);

    this.sender.connect(receiverTransform);

    return new TransformChain(this.dataPipe, this, receiverTransform);
  }
}

export class TransformChain<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
  NewValueT,
  NewMetadataT,
> extends TransformBase<InValueT, InMetadataT, NewValueT, NewMetadataT> {
  public constructor(
    dataPipe: DataPipe,
    public readonly from: TransformBase<
      InValueT,
      InMetadataT,
      OutValueT,
      OutMetadataT
    >,
    public readonly to: TransformBase<
      OutValueT,
      OutMetadataT,
      NewValueT,
      NewMetadataT
    >,
  ) {
    super(dataPipe, null);
  }

  public async join(): Promise<void> {
    await this.to.join();
  }
  public onItem(value: InValueT, metadata: InMetadataT): void {
    this.from.onItem(value, metadata);
  }
  public onError(error: Error): void {
    this.from.onError(error);
  }
  public onEof(): void {
    this.from.onEof();
  }

  public chain<NextValueT, NextMetadataT>(
    handler:
      | Handler<NewValueT, NewMetadataT, NextValueT, NextMetadataT>
      | TransformBase<NewValueT, NewMetadataT, NextValueT, NextMetadataT>,
    name?: string | null,
  ): TransformBase<InValueT, InMetadataT, NextValueT, NextMetadataT> {
    return new TransformChain(
      this.dataPipe,
      this.from,
      this.to.chain(handler, name),
    );
  }
}
