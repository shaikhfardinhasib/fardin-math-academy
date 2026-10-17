import type { Difficulty, Exercise, Question, TargetExam } from "@/lib/questions/schema";

export interface Student {
  name: string;
  roll: string;
}

/** A question as presented in one session: options shuffled, correctIndex remapped to match. */
export interface SessionQuestion {
  id: string;
  source: Question;
  options: string[];
  correctIndex: number;
}

export interface AnswerRecord {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  /** Epoch ms, supplied by the caller. */
  answeredAt: number;
}

export interface QuizConfig {
  mode: "chapter" | "exercise";
  /** Used when mode === "exercise". */
  exercise?: Exercise;
  count: number;
  difficulty?: Difficulty;
  targetExam?: TargetExam;
}
