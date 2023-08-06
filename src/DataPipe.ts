import { DataPipeBase } from "./DataPipeBase";
import { ContextT, ITransform, SampleType } from "./ITransform";
import { staticInput } from "./staticInput";
import { filterMap } from "./transforms/filterMap";
import { group } from "./transforms/group";
import { sample } from "./transforms/sample";

export class DataPipe extends DataPipeBase {
  public addStaticInput<ValueT>(data: ValueT[], name = "staticInput") {
    return staticInput(this, data, name);
  }

  public override filter<ValueT, MetadataT>(
    callbackFn: (value: ValueT, metadata: MetadataT) => boolean,
    name: string,
  ): ITransform<ValueT, MetadataT, ValueT, MetadataT> {
    return filterMap(
      this,
      (value, metadata) => {
        const res = callbackFn(value, metadata);
        return res ? { value, metadata } : undefined;
      },
      name,
    );
  }

  public override map<InValueT, InMetadataT, OutValueT, OutMetadataT>(
    callbackFn: (
      value: InValueT,
      metadata: InMetadataT,
    ) => { value: OutValueT; metadata: OutMetadataT },
    name: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT> {
    return filterMap(
      this,
      (value, metadata) => {
        const mapped = callbackFn(value, metadata);
        return { value: mapped.value, metadata: mapped.metadata };
      },
      name,
    );
  }

  public override mapValue<InValueT, InMetadataT, OutValueT>(
    callbackFn: (value: InValueT, metadata: InMetadataT) => OutValueT,
    name?: string,
  ): ITransform<InValueT, InMetadataT, OutValueT, InMetadataT> {
    return filterMap(
      this,
      (value, metadata) => {
        const newValue = callbackFn(value, metadata);
        return { value: newValue, metadata };
      },
      name,
    );
  }

  public override mapMetadata<InValueT, InMetadataT, OutMetadataT>(
    callbackFn: (value: InValueT, metadata: InMetadataT) => OutMetadataT,
    name: string,
  ): ITransform<InValueT, InMetadataT, InValueT, OutMetadataT> {
    return filterMap(
      this,
      (value, metadata) => {
        const newMetadata = callbackFn(value, metadata);
        return { value, metadata: newMetadata };
      },
      name,
    );
  }

  public override group<
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
  ): ITransform<InValueT, InMetadataT, OutValueT, OutMetadataT> {
    return group(this, props, name);
  }

  public override sample<ValueT, MetadataT, IndexT>(
    props: {
      indexFn: (value: ValueT, metadata: MetadataT) => IndexT;
      isIndexEqualFn?: (l: IndexT, r: IndexT) => boolean;
      sampleType: SampleType<ValueT, MetadataT>;
    },
    name: string,
  ): ITransform<ValueT, MetadataT, ValueT, MetadataT> {
    return sample(this, props, name);
  }
}
