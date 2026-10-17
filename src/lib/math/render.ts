import katex from "katex";

/**
 * KaTeX → HTML string. Returns null if KaTeX throws anyway (e.g. an internal
 * error); callers then fall back to the raw source text.
 * `trust: false` blocks \href/\url/\includegraphics style escapes.
 */
export function renderMathToHtml(source: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(source, {
      throwOnError: false,
      trust: false,
      displayMode,
    });
  } catch {
    return null;
  }
}
