export type ContextT<OutValueT, OutMetadataT> = {
  emitItem(value: OutValueT, metadata: OutMetadataT): void;
  emitError(error: Error): void;
  emitEof(): void;

  setCancelFn(cancelFn: () => void): void;
  isStopped(): boolean;
};

export type SampleType<ValueT, MetadataT> =
  | "first"
  | "last"
  | "random"
  | {
      type: "min";
      valueFn: (value: ValueT, metadata: MetadataT) => number;
    }
  | {
      type: "max";
      valueFn: (value: ValueT, metadata: MetadataT) => number;
    };

export interface ITransformMixins<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
> {
  filter(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => boolean,
    name?: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT>;

  map<NewValueT, NewMetadataT>(
    callbackFn: (
      value: OutValueT,
      metadata: OutMetadataT,
    ) => { value: NewValueT; metadata: NewMetadataT },
    name?: string,
  ): ITransform<InValueT, InMetadataT, NewValueT, NewMetadataT>;

  mapValue<NewValueT>(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => NewValueT,
    name?: string,
  ): ITransform<InValueT, InMetadataT, NewValueT, OutMetadataT>;

  mapMetadata<NewMetadataT>(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => NewMetadataT,
    name?: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, NewMetadataT>;

  group<NewValueT, NewMetadataT, IndexT>(props: {
    indexFn: (value: OutValueT, metadata: OutMetadataT) => IndexT;
    isIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
    startGroupFn: (
      groupIndex: IndexT,
      ctx: ContextT<NewValueT, NewMetadataT>,
    ) => void;
    addItemFn: (
      value: OutValueT,
      metadata: OutMetadataT,
      ctx: ContextT<NewValueT, NewMetadataT>,
    ) => void | Promise<void>;
    endGroupFn: (
      error: Error | undefined,
      ctx: ContextT<NewValueT, NewMetadataT>,
    ) => void;
  }): ITransform<InValueT, InMetadataT, NewValueT, NewMetadataT>;

  sample<IndexT>(
    props: {
      indexFn: (value: OutValueT, metadata: OutMetadataT) => IndexT;
      isIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
      sampleType: SampleType<OutValueT, OutMetadataT>;
    },
    name?: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT>;
}

export interface ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT>
  extends ITransformMixins<InValueT, InMetadataT, OutValueT, OutMetadataT> {
  onItem(value: InValueT, metadata: InMetadataT): void;
  onError(error: Error): void;
  onEof(): void;

  chain<NewValueT, NewMetadataT>(
    receiver: ITransform<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
  ): ITransform<InValueT, InMetadataT, NewValueT, NewMetadataT>;

  join(): Promise<void>;

  _start(): void;
  _cancel(): void;
}
