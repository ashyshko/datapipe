import { DataPipeBase } from "./DataPipeBase";
import {
  ContextT,
  ITransform,
  ITransformMixins,
  SampleType,
} from "./ITransform";

export abstract class TransformMixins<
  InValueT,
  InMetadataT,
  OutValueT,
  OutMetadataT,
> implements ITransformMixins<InValueT, InMetadataT, OutValueT, OutMetadataT>
{
  public constructor(public readonly dataPipe: DataPipeBase) {}

  public filter(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => boolean,
    name?: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT> {
    return this.chain(this.dataPipe.filter(callbackFn, name ?? "filter"));
  }

  public map<NewValueT, NewMetadataT>(
    callbackFn: (
      value: OutValueT,
      metadata: OutMetadataT,
    ) => { value: NewValueT; metadata: NewMetadataT },
    name?: string,
  ): ITransform<InValueT, InMetadataT, NewValueT, NewMetadataT> {
    return this.chain(this.dataPipe.map(callbackFn, name ?? "map"));
  }

  public mapValue<NewValueT>(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => NewValueT,
    name?: string,
  ): ITransform<InValueT, InMetadataT, NewValueT, OutMetadataT> {
    return this.chain(this.dataPipe.mapValue(callbackFn, name ?? "mapValue"));
  }

  public mapMetadata<NewMetadataT>(
    callbackFn: (value: OutValueT, metadata: OutMetadataT) => NewMetadataT,
    name?: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, NewMetadataT> {
    return this.chain(
      this.dataPipe.mapMetadata(callbackFn, name ?? "mapMetadata"),
    );
  }

  public group<IndexT, NewValueT, NewMetadataT>(
    props: {
      indexFn: (value: OutValueT, metadata: OutMetadataT) => IndexT;
      isIndexEqualFn: (l: IndexT, r: IndexT) => boolean;
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
    },
    name?: string,
  ): ITransform<InValueT, InMetadataT, NewValueT, NewMetadataT> {
    return this.chain(this.dataPipe.group(props, name ?? "group"));
  }

  public sample<IndexT>(
    props: {
      indexFn: (value: OutValueT, metadata: OutMetadataT) => IndexT;
      isIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
      sampleType: SampleType<OutValueT, OutMetadataT>;
    },
    name?: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT> {
    return this.chain(this.dataPipe.sample(props, name ?? "sample"));
  }

  public abstract chain<NewValueT, NewMetadataT>(
    receiver: ITransform<OutValueT, OutMetadataT, NewValueT, NewMetadataT>,
  ): ITransform<InValueT, InMetadataT, NewValueT, NewMetadataT>;
}
