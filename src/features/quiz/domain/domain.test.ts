import { describe, expect, it } from "vitest";
import rawQuestions from "@/data/straight-lines.json";
import type { Question } from "@/lib/questions/schema";
import { validateQuestionBank } from "@/lib/questions/validate";
import { mulberry32 } from "@/lib/random/seeded";
import { initialQuizState, quizReducer, type QuizState } from "./reducer";
import { percentage, score, shouldCelebrate, elapsedSeconds, wrongAnswers } from "./selectors";
import { buildSession } from "./session";
import type { QuizConfig, SessionQuestion, Student } from "./types";

const { questions: bank } = validateQuestionBank(rawQuestions);
const student: Student = { name: "Test", roll: "1" };

function makeQuestions(n: number): SessionQuestion[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `Q${i}`,
    source: bank[0] as Question,
    options: ["a", "b", "c", "d"],
    correctIndex: 2,
  }));
}

function started(n = 2): Extract<QuizState, { status: "inProgress" }> {
  const s = quizReducer(initialQuizState, { type: "START", student, questions: makeQuestions(n), now: 1000 });
  if (s.status !== "inProgress") throw new Error("expected inProgress");
  return s;
}

describe("buildSession", () => {
  const chapter: QuizConfig = { mode: "chapter", count: bank.length };

  it("remaps correctIndex so it points at the same option text, for every question", () => {
    for (const seed of [1, 2, 3, 99]) {
      const session = buildSession(bank, chapter, mulberry32(seed));
      expect(session).toHaveLength(140);
      for (const sq of session) {
        expect(sq.options[sq.correctIndex]).toBe(sq.source.options[sq.source.correct]);
        expect([...sq.options].sort()).toEqual([...sq.source.options].sort());
      }
    }
  });

  it("actually moves the correct answer around (correct=0 in the data)", () => {
    const session = buildSession(bank, chapter, mulberry32(5));
    const positions = new Set(session.map((s) => s.correctIndex));
    expect(positions.size).toBe(4);
  });

  it("respects count and exercise filters", () => {
    const s = buildSession(bank, { mode: "exercise", exercise: "III B", count: 3 }, mulberry32(1));
    expect(s).toHaveLength(3);
    expect(s.every((q) => q.source.exercise === "III B")).toBe(true);
  });

  it("chapter mode ignores the exercise field", () => {
    const s = buildSession(bank, { mode: "chapter", exercise: "III B", count: 140 }, mulberry32(1));
    expect(new Set(s.map((q) => q.source.exercise)).size).toBeGreaterThan(1);
  });

  it("returns fewer than count when the pool is small, and [] for count 0 or empty pool", () => {
    const pool = bank.filter((q) => q.exercise === "III A").length;
    expect(buildSession(bank, { mode: "exercise", exercise: "III A", count: 9999 }, mulberry32(1))).toHaveLength(pool);
    expect(buildSession(bank, { mode: "chapter", count: 0 }, mulberry32(1))).toEqual([]);
    expect(buildSession([], chapter, mulberry32(1))).toEqual([]);
  });

  it("has no duplicate questions and does not mutate the bank", () => {
    const before = JSON.stringify(bank);
    const s = buildSession(bank, chapter, mulberry32(3));
    expect(new Set(s.map((q) => q.id)).size).toBe(s.length);
    expect(JSON.stringify(bank)).toBe(before);
  });

  it("is deterministic for a given seed", () => {
    const a = buildSession(bank, { mode: "chapter", count: 10 }, mulberry32(8));
    const b = buildSession(bank, { mode: "chapter", count: 10 }, mulberry32(8));
    expect(a).toEqual(b);
  });
});

describe("quizReducer happy path", () => {
  it("registration → inProgress → finished, with score derived from answers", () => {
    let s = started(2);
    expect(s).toMatchObject({ currentIndex: 0, startedAt: 1000, answers: [] });

    s = quizReducer(s, { type: "ANSWER", selectedIndex: 2, now: 2000 }) as typeof s;
    expect(s.answers).toEqual([{ questionId: "Q0", selectedIndex: 2, isCorrect: true, answeredAt: 2000 }]);

    s = quizReducer(s, { type: "NEXT", now: 2500 }) as typeof s;
    expect(s.currentIndex).toBe(1);

    s = quizReducer(s, { type: "ANSWER", selectedIndex: 0, now: 3000 }) as typeof s;
    const done = quizReducer(s, { type: "NEXT", now: 4000 });
    expect(done.status).toBe("finished");
    if (done.status !== "finished") return;
    expect(done.finishedAt).toBe(4000);
    expect(done.startedAt).toBe(1000);
    expect(score(done.answers)).toBe(1);
    expect(percentage(done.answers, done.questions.length)).toBe(50);
    expect("score" in done).toBe(false);
  });

  it("RESET returns to registration from any state", () => {
    expect(quizReducer(started(), { type: "RESET" })).toEqual(initialQuizState);
  });
});

describe("quizReducer illegal transitions are no-ops", () => {
  const finished = (() => {
    let s: QuizState = started(1);
    s = quizReducer(s, { type: "ANSWER", selectedIndex: 0, now: 2 });
    return quizReducer(s, { type: "NEXT", now: 3 });
  })();

  it("ANSWER twice on the same question", () => {
    const once = quizReducer(started(), { type: "ANSWER", selectedIndex: 0, now: 5 });
    expect(quizReducer(once, { type: "ANSWER", selectedIndex: 2, now: 6 })).toBe(once);
  });

  it("NEXT before answering", () => {
    const s = started();
    expect(quizReducer(s, { type: "NEXT", now: 5 })).toBe(s);
  });

  it("ANSWER / NEXT when not inProgress", () => {
    expect(finished.status).toBe("finished");
    for (const state of [initialQuizState, finished]) {
      expect(quizReducer(state, { type: "ANSWER", selectedIndex: 0, now: 1 })).toBe(state);
      expect(quizReducer(state, { type: "NEXT", now: 1 })).toBe(state);
    }
  });

  it("ANSWER with an out-of-range or non-integer index", () => {
    const s = started();
    for (const selectedIndex of [-1, 4, 1.5, Number.NaN]) {
      expect(quizReducer(s, { type: "ANSWER", selectedIndex, now: 1 })).toBe(s);
    }
  });

  it("START when already inProgress or finished", () => {
    const action = { type: "START", student, questions: makeQuestions(1), now: 9 } as const;
    const s = started();
    expect(quizReducer(s, action)).toBe(s);
    expect(quizReducer(finished, action)).toBe(finished);
  });

  it("START with no questions", () => {
    expect(quizReducer(initialQuizState, { type: "START", student, questions: [], now: 1 })).toBe(initialQuizState);
  });

  it("RESET on registration", () => {
    expect(quizReducer(initialQuizState, { type: "RESET" })).toBe(initialQuizState);
  });
});

describe("selectors", () => {
  const rec = (isCorrect: boolean, i: number) => ({
    questionId: `Q${i}`,
    selectedIndex: isCorrect ? 2 : 0,
    isCorrect,
    answeredAt: i,
  });

  it("score / percentage / empty total", () => {
    const answers = [rec(true, 0), rec(false, 1), rec(true, 2)];
    expect(score(answers)).toBe(2);
    expect(percentage(answers, 3)).toBeCloseTo(66.67, 1);
    expect(percentage([], 0)).toBe(0);
  });

  it("celebrates at >= 80% exactly, for any question count", () => {
    const ten = (n: number) => Array.from({ length: 10 }, (_, i) => rec(i < n, i));
    expect(shouldCelebrate(ten(8), 10)).toBe(true);
    expect(shouldCelebrate(ten(7), 10)).toBe(false);
    const five = Array.from({ length: 5 }, (_, i) => rec(i < 4, i));
    expect(shouldCelebrate(five, 5)).toBe(true);
    expect(shouldCelebrate([], 0)).toBe(false);
  });

  it("elapsedSeconds floors and never goes negative", () => {
    expect(elapsedSeconds(1000, 3999)).toBe(2);
    expect(elapsedSeconds(5000, 1000)).toBe(0);
  });

  it("wrongAnswers pairs wrong answers with their questions", () => {
    const qs = makeQuestions(3);
    const result = wrongAnswers(qs, [rec(true, 0), rec(false, 1), rec(false, 2)]);
    expect(result.map((w) => w.question.id)).toEqual(["Q1", "Q2"]);
  });
});
