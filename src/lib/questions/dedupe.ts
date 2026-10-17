import type { Question } from "./schema";

export class DuplicateConflictError extends Error {
  readonly ids: readonly string[];

  constructor(ids: readonly string[]) {
    super(
      `Question ids reused with different content: ${ids.join(", ")}. ` +
        "Identical duplicates are collapsed automatically; these are not identical.",
    );
    this.name = "DuplicateConflictError";
    this.ids = ids;
  }
}

/** JSON with object keys sorted, so key order never affects equality. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) => {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(
        Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    }
    return v;
  });
}

export interface DedupeResult {
  questions: Question[];
  /** Number of identical duplicate entries that were dropped. */
  removed: number;
}

/**
 * Collapses entries sharing an id. Identical copies keep the first occurrence
 * (order preserved); same id with different content throws, listing every
 * conflicting id.
 */
export function dedupeQuestions(questions: readonly Question[]): DedupeResult {
  const seen = new Map<string, { fingerprint: string }>();
  const kept: Question[] = [];
  const conflicts = new Set<string>();

  for (const q of questions) {
    const fingerprint = canonical(q);
    const prior = seen.get(q.id);
    if (!prior) {
      seen.set(q.id, { fingerprint });
      kept.push(q);
    } else if (prior.fingerprint !== fingerprint) {
      conflicts.add(q.id);
    }
  }

  if (conflicts.size > 0) throw new DuplicateConflictError([...conflicts]);
  return { questions: kept, removed: questions.length - kept.length };
}
