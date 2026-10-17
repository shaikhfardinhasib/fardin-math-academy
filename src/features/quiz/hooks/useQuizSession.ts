import { useCallback, useReducer } from "react";
import { initialQuizState, quizReducer } from "../domain/reducer";
import { buildSession } from "../domain/session";
import type { QuizConfig, Student } from "../domain/types";
import type { Question } from "@/lib/questions/schema";

export type StartResult = { ok: true } | { ok: false; reason: "no-questions" };

interface Environment {
  now?: () => number;
  rng?: () => number;
}

/**
 * Wraps the pure reducer. This is the edge of the system: the clock and RNG
 * are injected here (defaulting to Date.now / Math.random) and passed into
 * the otherwise pure domain code.
 */
export function useQuizSession(questions: readonly Question[], env: Environment = {}) {
  const { now = Date.now, rng = Math.random } = env;
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);

  const start = useCallback(
    (student: Student, config: QuizConfig): StartResult => {
      const session = buildSession(questions, config, rng);
      if (session.length === 0) return { ok: false, reason: "no-questions" };
      dispatch({ type: "START", student, questions: session, now: now() });
      return { ok: true };
    },
    [questions, rng, now],
  );

  const answer = useCallback(
    (selectedIndex: number) => dispatch({ type: "ANSWER", selectedIndex, now: now() }),
    [now],
  );
  const next = useCallback(() => dispatch({ type: "NEXT", now: now() }), [now]);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, start, answer, next, reset };
}
