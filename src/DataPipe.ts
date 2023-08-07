import { Transform, TransformBase } from "./Transform";
import { input } from "./input";

export class DataPipe {
  public async join(): Promise<void> {
    await Promise.all(this.transforms.map((v) => v.join()));
  }

  public addInput<InValueT>(
    values: InValueT[],
    name = "input",
  ): Transform<never, never, InValueT, undefined> {
    return new Transform(
      this,
      input((control) => {
        values.forEach((v) => control.emitItem(v, undefined));
        control.emitEof();
      }),
      name,
    );
  }

  private transforms: TransformBase<any, any, any, any>[] = [];
  // called by Transform on ctor
  public _registerTransform(transform: TransformBase<any, any, any, any>) {
    this.transforms.push(transform);
  }
}
