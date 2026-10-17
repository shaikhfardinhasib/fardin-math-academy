import { filterQuestions } from "@/lib/questions/filter";
import type { Question } from "@/lib/questions/schema";
import { shuffle } from "@/lib/random/shuffle";
import type { QuizConfig, SessionQuestion } from "./types";

function toSessionQuestion(source: Question, rng: () => number): SessionQuestion {
  // permutation[newIndex] = oldIndex
  const permutation = shuffle(
    source.options.map((_, i) => i),
    rng,
  );
  return {
    id: source.id,
    source,
    options: permutation.map((old) => source.options[old]),
    correctIndex: permutation.indexOf(source.correct),
  };
}

/** filter → shuffle questions → take count → shuffle each question's options. */
export function buildSession(
  questions: readonly Question[],
  config: QuizConfig,
  rng: () => number,
): SessionQuestion[] {
  const pool = filterQuestions(questions, {
    exercise: config.mode === "exercise" ? config.exercise : undefined,
    difficulty: config.difficulty,
    targetExam: config.targetExam,
  });
  const count = Math.max(0, Math.floor(config.count));
  return shuffle(pool, rng)
    .slice(0, count)
    .map((q) => toSessionQuestion(q, rng));
}
