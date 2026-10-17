import type { AnswerRecord, SessionQuestion, Student } from "./types";

export type QuizState =
  | { status: "registration" }
  | {
      status: "inProgress";
      student: Student;
      questions: readonly SessionQuestion[];
      currentIndex: number;
      answers: readonly AnswerRecord[];
      startedAt: number;
    }
  | {
      status: "finished";
      student: Student;
      questions: readonly SessionQuestion[];
      answers: readonly AnswerRecord[];
      startedAt: number;
      finishedAt: number;
    };

export type QuizAction =
  | { type: "START"; student: Student; questions: readonly SessionQuestion[]; now: number }
  | { type: "ANSWER"; selectedIndex: number; now: number }
  | { type: "NEXT"; now: number }
  | { type: "RESET" };

export const initialQuizState: QuizState = { status: "registration" };

/**
 * Pure state machine. Illegal transitions return the same state object —
 * they never throw. The current question counts as answered when
 * answers.length === currentIndex + 1.
 */
export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START": {
      if (state.status !== "registration" || action.questions.length === 0) return state;
      return {
        status: "inProgress",
        student: action.student,
        questions: action.questions,
        currentIndex: 0,
        answers: [],
        startedAt: action.now,
      };
    }

    case "ANSWER": {
      if (state.status !== "inProgress") return state;
      if (state.answers.length !== state.currentIndex) return state; // already answered
      const question = state.questions[state.currentIndex];
      if (!question) return state;
      const { selectedIndex } = action;
      if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
        return state;
      }
      const record: AnswerRecord = {
        questionId: question.id,
        selectedIndex,
        isCorrect: selectedIndex === question.correctIndex,
        answeredAt: action.now,
      };
      return { ...state, answers: [...state.answers, record] };
    }

    case "NEXT": {
      if (state.status !== "inProgress") return state;
      if (state.answers.length !== state.currentIndex + 1) return state; // not answered yet
      if (state.currentIndex + 1 < state.questions.length) {
        return { ...state, currentIndex: state.currentIndex + 1 };
      }
      return {
        status: "finished",
        student: state.student,
        questions: state.questions,
        answers: state.answers,
        startedAt: state.startedAt,
        finishedAt: action.now,
      };
    }

    case "RESET":
      return state.status === "registration" ? state : initialQuizState;
  }
}
