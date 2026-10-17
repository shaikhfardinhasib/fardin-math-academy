export type MathToken =
  | { kind: "text"; value: string }
  | { kind: "inline"; value: string }
  | { kind: "block"; value: string };

/**
 * Index of the first unescaped `delim` at or after `from`, or -1.
 * A backslash escapes the following character (so `\$` inside math is skipped).
 */
function findClosing(src: string, from: number, delim: string): number {
  for (let j = from; j < src.length; j++) {
    if (src[j] === "\\") {
      j++;
      continue;
    }
    if (src.startsWith(delim, j)) return j;
  }
  return -1;
}

/**
 * Splits text into plain text, `$inline$` math and `$$block$$` math.
 *  - `\$` outside math is a literal dollar sign (emitted as `$` in text).
 *  - An unclosed `$` or `$$` is plain text.
 *  - Adjacent text is merged; empty tokens are never produced.
 */
export function tokenize(input: string): MathToken[] {
  const tokens: MathToken[] = [];
  let buffer = "";

  const flush = () => {
    if (buffer) tokens.push({ kind: "text", value: buffer });
    buffer = "";
  };

  let i = 0;
  while (i < input.length) {
    const ch = input[i];

    if (ch === "\\" && input[i + 1] === "$") {
      buffer += "$";
      i += 2;
      continue;
    }

    if (ch === "$") {
      if (input[i + 1] === "$") {
        const close = findClosing(input, i + 2, "$$");
        const inner = close === -1 ? "" : input.slice(i + 2, close);
        if (close !== -1 && inner.trim()) {
          flush();
          tokens.push({ kind: "block", value: inner });
          i = close + 2;
          continue;
        }
        // Unclosed or empty `$$`: first `$` is text; the next iteration retries on the second.
        buffer += ch;
        i++;
        continue;
      }

      const close = findClosing(input, i + 1, "$");
      if (close !== -1) {
        flush();
        tokens.push({ kind: "inline", value: input.slice(i + 1, close) });
        i = close + 1;
        continue;
      }
    }

    buffer += ch;
    i++;
  }

  flush();
  return tokens;
}
