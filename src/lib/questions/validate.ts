import { dedupeQuestions } from "./dedupe";
import { questionSchema, type Question } from "./schema";

export interface QuestionProblem {
  index: number;
  id: string;
  reason: string;
}

export class QuestionValidationError extends Error {
  readonly problems: readonly QuestionProblem[];

  constructor(problems: readonly QuestionProblem[]) {
    super(
      `${problems.length} invalid question(s):\n` +
        problems
          .map((p) => `  [#${p.index}] ${p.id}: ${p.reason}`)
          .join("\n"),
    );
    this.name = "QuestionValidationError";
    this.problems = problems;
  }
}

function idOf(entry: unknown): string {
  if (entry !== null && typeof entry === "object" && "id" in entry) {
    const id = (entry as { id: unknown }).id;
    if (typeof id === "string" && id) return id;
  }
  return "<no id>";
}

export interface QuestionBank {
  questions: Question[];
  duplicatesRemoved: number;
}

/**
 * Pure validation of raw JSON: every entry is checked and ALL problems are
 * reported together, then identical duplicates are collapsed.
 * Throws QuestionValidationError or DuplicateConflictError.
 */
export function validateQuestionBank(raw: unknown): QuestionBank {
  if (!Array.isArray(raw)) {
    throw new QuestionValidationError([
      { index: -1, id: "<root>", reason: "expected a JSON array of questions" },
    ]);
  }

  const valid: Question[] = [];
  const problems: QuestionProblem[] = [];

  raw.forEach((entry: unknown, index) => {
    const result = questionSchema.safeParse(entry);
    if (result.success) {
      valid.push(result.data);
      return;
    }
    const reason = result.error.issues
      .map((i) => `${i.path.join(".") || "(entry)"}: ${i.message}`)
      .join("; ");
    problems.push({ index, id: idOf(entry), reason });
  });

  if (problems.length > 0) throw new QuestionValidationError(problems);

  const { questions, removed } = dedupeQuestions(valid);
  return { questions, duplicatesRemoved: removed };
}
