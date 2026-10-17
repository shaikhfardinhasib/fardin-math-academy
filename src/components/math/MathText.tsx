import { memo, useMemo, type ReactNode } from "react";
import { renderMathToHtml } from "@/lib/math/render";
import { tokenize } from "@/lib/math/tokenize";
import { stripCitations } from "@/lib/text/sanitize";

interface Props {
  text: string;
}

/** Renders text containing `$inline$` and `$$block$$` LaTeX. Never throws on bad LaTeX. */
function MathTextImpl({ text }: Props) {
  const nodes = useMemo<ReactNode[]>(
    () =>
      tokenize(stripCitations(text)).map((token, i) => {
        if (token.kind === "text") return <span key={i}>{token.value}</span>;

        const display = token.kind === "block";
        const html = renderMathToHtml(token.value, display);
        if (html === null) {
          const delim = display ? "$$" : "$";
          return <span key={i}>{`${delim}${token.value}${delim}`}</span>;
        }
        return (
          <span
            key={i}
            className={display ? "block" : undefined}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }),
    [text],
  );

  if (!text) return null;
  return <span>{nodes}</span>;
}

const MathText = memo(MathTextImpl);
export default MathText;
