import type { Difficulty, Exercise, Question, TargetExam } from "./schema";

export interface QuestionFilter {
  exercise?: Exercise;
  difficulty?: Difficulty;
  targetExam?: TargetExam;
}

/** Pure filter; an undefined criterion matches everything. */
export function filterQuestions(
  questions: readonly Question[],
  { exercise, difficulty, targetExam }: QuestionFilter,
): Question[] {
  return questions.filter(
    (q) =>
      (exercise === undefined || q.exercise === exercise) &&
      (difficulty === undefined || q.difficulty === difficulty) &&
      (targetExam === undefined || q.target_exam.includes(targetExam)),
  );
}
