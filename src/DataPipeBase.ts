import {
  ContextT,
  ITransform,
  ITransformMixins,
  SampleType,
} from "./ITransform";

export abstract class DataPipeBase {
  public start(): void {
    this.transforms.forEach((transform) => transform._start());
  }

  public cancel(): void {
    this.transforms.forEach((transform) => transform._cancel());
  }

  public async join(): Promise<void> {
    await Promise.all(this.transforms.map((v) => v.join()));
  }

  private transforms: ITransform<any, any, any, any>[] = [];
  // called by Transform on ctor
  public _registerTransform(transform: ITransform<any, any, any, any>) {
    this.transforms.push(transform);
  }

  public abstract filter<ValueT, MetadataT>(
    callbackFn: (value: ValueT, metadata: MetadataT) => boolean,
    name: string,
  ): ITransform<ValueT, MetadataT, ValueT, MetadataT>;

  public abstract map<InValueT, InMetadataT, OutValueT, OutMetadataT>(
    callbackFn: (
      value: InValueT,
      metadata: InMetadataT,
    ) => { value: OutValueT; metadata: OutMetadataT },
    name: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT>;

  public abstract mapValue<InValueT, InMetadataT, OutValueT>(
    callbackFn: (value: InValueT, metadata: InMetadataT) => OutValueT,
    name: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, InMetadataT>;

  public abstract mapMetadata<InValueT, InMetadataT, OutMetadataT>(
    callbackFn: (value: InValueT, metadata: InMetadataT) => OutMetadataT,
    name: string,
  ): ITransform<InValueT, InMetadataT, InValueT, OutMetadataT>;

  public abstract group<
    InValueT,
    InMetadataT,
    OutValueT,
    OutMetadataT,
    IndexT = number,
  >(
    props: {
      indexFn: (value: InValueT, metadata: InMetadataT) => IndexT;
      isIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
      startGroupFn: (
        groupIndex: IndexT,
        ctx: ContextT<OutValueT, OutMetadataT>,
      ) => void;
      addItemFn: (
        value: InValueT,
        metadata: InMetadataT,
        ctx: ContextT<OutValueT, OutMetadataT>,
      ) => void | Promise<void>;
      endGroupFn: (
        error: Error | undefined,
        ctx: ContextT<OutValueT, OutMetadataT>,
      ) => void;
    },
    name: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT>;

  public abstract sample<ValueT, MetadataT, IndexT>(
    props: {
      indexFn: (value: ValueT, metadata: MetadataT) => IndexT;
      isIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
      sampleType: SampleType<ValueT, MetadataT>;
    },
    name: string,
  ): ITransform<ValueT, MetadataT, ValueT, MetadataT>;
}
