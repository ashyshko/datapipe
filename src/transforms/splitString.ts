import { NormalizedHandler } from "../Handler";
import { withContext } from "../withContext";

export function splitString<MetadataT>(
  separator: string | RegExp,
): NormalizedHandler<
  string,
  MetadataT,
  string,
  { originalMetadata: MetadataT; itemIndex: number }
> {
  if (separator === "") {
    throw new Error("incorrect separator provided: empty string");
  }

  const find = (
    line: string,
    force: boolean,
  ): { updatedLine: string; emitLine: string } | undefined => {
    if (line.length === 0) {
      return undefined;
    }

    if (separator instanceof RegExp) {
      const match = line.match(separator);

      if (!match) {
        if (force) {
          return {
            updatedLine: "",
            emitLine: line,
          };
        }
        return undefined;
      }

      /* istanbul ignore next */
      if (match.index === undefined) {
        throw new Error("internal error: no index returned by string.match");
      }

      if (match[0].length === 0) {
        throw new Error(
          "incorrect separator provided: empty string has been captured",
        );
      }

      if (!force && match.index + match[0].length >= line.length) {
        return undefined;
      }

      return {
        emitLine: line.slice(0, match.index),
        updatedLine: line.slice(match.index + match[0].length),
      };
    } else {
      const index = line.indexOf(separator);
      if (index < 0) {
        if (force) {
          return {
            updatedLine: "",
            emitLine: line,
          };
        }

        return undefined;
      }

      return {
        emitLine: line.slice(0, index),
        updatedLine: line.slice(index + separator.length),
      };
    }
  };

  let itemIndex = 0;

  return withContext({
    init() {
      return undefined as
        | {
            text: string;
            firstMetadata: MetadataT;
          }
        | undefined;
    },
    onItem(value, metadata, control) {
      if (control.context === undefined) {
        control.context = {
          text: value,
          firstMetadata: metadata,
        };
      } else {
        control.context.text += value;
      }

      for (;;) {
        const res = find(control.context.text, /*force*/ false);
        if (!res) {
          break;
        }

        control.emitItem(res.emitLine, {
          itemIndex,
          originalMetadata: control.context.firstMetadata,
        });
        ++itemIndex;
        if (res.updatedLine.length > 0) {
          control.context = {
            text: res.updatedLine,
            firstMetadata: metadata,
          };
        } else {
          control.context = undefined;
          break;
        }
      }
    },
    onEof(control) {
      // only one iteration should be done - it should send leftovers
      while (control.context !== undefined) {
        const res = find(control.context.text, /*force*/ true);
        if (!res) {
          break;
        }

        control.emitItem(res.emitLine, {
          originalMetadata: control.context.firstMetadata,
          itemIndex,
        });
        ++itemIndex;
        control.context = {
          text: res.updatedLine,
          firstMetadata: control.context.firstMetadata,
        };
      }
      control.emitEof();
    },
  });
}
