import { NormalizedHandler } from "../Handler";
import { pipe } from "../pipe";
import { withContext } from "../withContext";
import { filterMap } from "./filterMap";
import { splitString } from "./splitString";

export function fromCsv<MetadataT>(
  props: {
    separator?: string;
    newLineDelimiter?: string;
    header?: string[];
  } = { separator: ",", newLineDelimiter: "\r\n" },
): NormalizedHandler<string, MetadataT, Record<string, string>, MetadataT> {
  let header: string[] | undefined = props.header;
  return pipe(
    pipe(splitString(props.newLineDelimiter ?? "\r\n"), parseCsvLine(props)),
    filterMap((value, metadata) => {
      if (header === undefined) {
        header = value;
        return undefined;
      }

      if (value.length !== header.length) {
        throw new Error(
          `column count missmatch: expected ${header.length}, found ${value.length}`,
        );
      }

      const res: Record<string, string> = {};
      header.forEach((field, index) => (res[field] = value[index]));
      return { value: res, metadata };
    }),
  );
}

export function parseCsvLine<MetadataT>(
  props: {
    separator?: string;
    newLineDelimiter?: string;
  } = { separator: ",", newLineDelimiter: "\r\n" },
): NormalizedHandler<string, MetadataT, string[], MetadataT> {
  const separator = props.separator ?? ",";
  const newLineDelimiter = props.newLineDelimiter ?? "\r\n";

  return withContext({
    init(control) {
      return undefined as
        | {
            parsedFields: string[];
            processed: string;
            firstMetadata: MetadataT;
          }
        | undefined;
    },
    onItem(value, metadata, control) {
      let state:
        | {
            type: "normal";
            quotedPrefix: string;
          }
        | {
            type: "quoted";
            processed: string;
          } = { type: "normal", quotedPrefix: "" };
      let parsedFields: string[] = [];

      if (control.context !== undefined) {
        state = {
          type: "quoted",
          processed: control.context.processed,
        };
        parsedFields = control.context.parsedFields;
        metadata = control.context.firstMetadata;
        control.context = undefined;
      }

      for (;;) {
        if (state.type === "normal") {
          if (value === "") {
            if (state.quotedPrefix !== "") {
              parsedFields.push(state.quotedPrefix);
              state.quotedPrefix = "";
            }

            control.emitItem(parsedFields, metadata);
            return;
          }

          const quotePos = value.indexOf('"');
          const separatorPos = value.indexOf(separator);
          if (separatorPos >= 0 && (quotePos < 0 || separatorPos < quotePos)) {
            parsedFields.push(
              state.quotedPrefix + value.slice(0, separatorPos),
            );
            state.quotedPrefix = "";
            value = value.slice(separatorPos + separator.length);
            continue;
          }

          if (quotePos < 0) {
            parsedFields.push(state.quotedPrefix + value);
            state.quotedPrefix = "";
            value = "";
            continue;
          }

          state = {
            type: "quoted",
            processed: value.slice(0, quotePos),
          };
          value = value.slice(quotePos + 1);
          continue;
        } else {
          if (value === "") {
            control.context = {
              parsedFields,
              processed: state.processed + newLineDelimiter,
              firstMetadata: metadata,
            };
            return;
          }

          const quotePos = value.indexOf('"');

          if (quotePos < 0) {
            state.processed += value;
            value = "";
            continue;
          }

          if (quotePos < value.length - 1 && value[quotePos + 1] === '"') {
            state.processed += value.slice(0, quotePos) + '"';
            value = value.slice(quotePos + 2);
            continue;
          }

          state.processed += value.slice(0, quotePos);
          value = value.slice(quotePos + 1);
          state = {
            type: "normal",
            quotedPrefix: state.processed,
          };
        }
      }
    },
    onEof(control) {
      if (control.context !== undefined) {
        control.emitError(new Error("incompleted quoted string"));
      } else {
        control.emitEof();
      }
    },
  });
}
