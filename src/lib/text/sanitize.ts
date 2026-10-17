/**
 * Matches citation artifacts left by LLM-generated content, e.g.
 * `[cite: 1, 2]`, `[cite_start]`, `[cite_end]`, with the spaces/tabs before them.
 */
const CITATION = /([ \t]*)\[cite(?:_start|_end)?(?::[^\]]*)?\]/gi;

/** Characters that may directly follow a removed marker without needing a separating space. */
const NO_SPACE_BEFORE = /[\s.,;:!?)\]।]/;

/**
 * Removes citation artifacts. The space before a marker is dropped when text
 * ends or punctuation follows ("a [cite: 1]." → "a."), but kept when a word
 * follows ("a [cite_start]b" → "a b") so words never fuse.
 */
export function stripCitations(text: string): string {
  return text.replace(CITATION, (match, spaces: string, offset: number, whole: string) => {
    const next = whole[offset + match.length];
    return next === undefined || NO_SPACE_BEFORE.test(next) ? "" : spaces;
  });
}
