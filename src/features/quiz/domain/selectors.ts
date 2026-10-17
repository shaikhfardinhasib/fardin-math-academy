import type { AnswerRecord, SessionQuestion } from "./types";

/** Score at or above this percentage triggers the celebration. */
export const CELEBRATE_THRESHOLD_PERCENT = 80;

export function score(answers: readonly AnswerRecord[]): number {
  return answers.filter((a) => a.isCorrect).length;
}

/** Exact (unrounded) percentage in [0, 100]; 0 when there are no questions. */
export function percentage(answers: readonly AnswerRecord[], totalQuestions: number): number {
  return totalQuestions > 0 ? (score(answers) / totalQuestions) * 100 : 0;
}

export function shouldCelebrate(answers: readonly AnswerRecord[], totalQuestions: number): boolean {
  return percentage(answers, totalQuestions) >= CELEBRATE_THRESHOLD_PERCENT;
}

/** Whole seconds between start and `until` (the finish time, or "now" while running). Never negative. */
export function elapsedSeconds(startedAt: number, until: number): number {
  return Math.max(0, Math.floor((until - startedAt) / 1000));
}

export interface WrongAnswer {
  question: SessionQuestion;
  answer: AnswerRecord;
}

/** Wrong answers paired with their questions, in answer order. For the future review tab. */
export function wrongAnswers(
  questions: readonly SessionQuestion[],
  answers: readonly AnswerRecord[],
): WrongAnswer[] {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return answers.flatMap((answer) => {
    const question = byId.get(answer.questionId);
    return !answer.isCorrect && question ? [{ question, answer }] : [];
  });
}
