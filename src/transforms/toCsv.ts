import { NormalizedHandler, normalize } from "../Handler";

export function toCsv<
  InValueT extends Record<string, string>,
  InMetadataT,
>(props: {
  separator?: string;
  newLineDelimiter?: string;
  fields: Extract<keyof InValueT, string>[];
  writeHeader?:
    | { type: "always"; metadata: InMetadataT }
    | "on_first_item"
    | "never";
}): NormalizedHandler<InValueT, InMetadataT, string, InMetadataT> {
  const separator = props.separator ?? ",";
  const newLineDelimiter = props.newLineDelimiter ?? "\r\n";
  const writeHeader = props.writeHeader ?? "on_first_item";

  const generateLine = (line: string[]) => {
    return (
      line
        .map((item: string) => {
          if (
            item.indexOf('"') < 0 &&
            item.indexOf(separator) < 0 &&
            item.indexOf(newLineDelimiter) < 0
          ) {
            return item;
          }

          return `"${item.replace(/"/g, '""')}"`;
        })
        .join(separator) + newLineDelimiter
    );
  };

  let headerWritten = false;

  return normalize({
    init(control) {
      if (
        writeHeader !== "on_first_item" &&
        writeHeader !== "never" &&
        writeHeader.type === "always"
      ) {
        control.emitItem(generateLine(props.fields), writeHeader.metadata);
      }
    },
    onItem(value, metadata, control) {
      if (!headerWritten && writeHeader === "on_first_item") {
        control.emitItem(generateLine(props.fields), metadata);
        headerWritten = true;
      }

      control.emitItem(
        generateLine(props.fields.map((field) => value[field] ?? "")),
        metadata,
      );
    },
  });
}
