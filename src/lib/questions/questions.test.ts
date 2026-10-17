import { describe, expect, it } from "vitest";
import rawQuestions from "@/data/straight-lines.json";
import { DuplicateConflictError, dedupeQuestions } from "./dedupe";
import { filterQuestions } from "./filter";
import { questionSchema, type Question } from "./schema";
import { QuestionValidationError, validateQuestionBank } from "./validate";

const base: Question = {
  id: "T_1",
  exercise: "III A",
  type_name: "t",
  difficulty: "easy",
  target_exam: ["hsc_standard"],
  question: "q",
  options: ["a", "b", "c", "d"],
  correct: 0,
  shortcut_tip: "",
  explanation: "e",
};

describe("questionSchema", () => {
  it("accepts a valid question", () => {
    expect(questionSchema.safeParse(base).success).toBe(true);
  });
  it("rejects 3 options", () => {
    expect(questionSchema.safeParse({ ...base, options: ["a", "b", "c"] }).success).toBe(false);
  });
  it("rejects correct=4 and negative", () => {
    expect(questionSchema.safeParse({ ...base, correct: 4 }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, correct: -1 }).success).toBe(false);
  });
  it("rejects unknown exercise, difficulty and exam", () => {
    expect(questionSchema.safeParse({ ...base, exercise: "III H" }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, difficulty: "insane" }).success).toBe(false);
    expect(questionSchema.safeParse({ ...base, target_exam: ["x"] }).success).toBe(false);
  });
  it("rejects blank strings", () => {
    expect(questionSchema.safeParse({ ...base, options: ["a", " ", "c", "d"] }).success).toBe(false);
  });
});

describe("dedupeQuestions", () => {
  it("collapses identical duplicates, keeping order", () => {
    const other = { ...base, id: "T_2" };
    const r = dedupeQuestions([base, other, { ...base }]);
    expect(r.questions.map((q) => q.id)).toEqual(["T_1", "T_2"]);
    expect(r.removed).toBe(1);
  });
  it("treats key order as irrelevant", () => {
    const reordered = Object.fromEntries(Object.entries(base).reverse()) as Question;
    expect(dedupeQuestions([base, reordered]).questions).toHaveLength(1);
  });
  it("throws listing every conflicting id", () => {
    const list = [
      base,
      { ...base, explanation: "different" },
      { ...base, id: "T_2" },
      { ...base, id: "T_2", correct: 1 },
    ];
    expect(() => dedupeQuestions(list)).toThrow(DuplicateConflictError);
    expect(() => dedupeQuestions(list)).toThrow(/T_1, T_2/);
  });
});

describe("validateQuestionBank", () => {
  it("reports ALL bad entries with index and id", () => {
    try {
      validateQuestionBank([base, { ...base, id: "B1", correct: 9 }, { ...base, id: "B2", options: [] }]);
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(QuestionValidationError);
      const { problems } = err as QuestionValidationError;
      expect(problems.map((p) => [p.index, p.id])).toEqual([[1, "B1"], [2, "B2"]]);
    }
  });
  it("rejects non-array input", () => {
    expect(() => validateQuestionBank({})).toThrow(QuestionValidationError);
  });
});

describe("shipped question bank", () => {
  it("is valid with no duplicate ids", () => {
    const { questions, duplicatesRemoved } = validateQuestionBank(rawQuestions);
    expect(questions).toHaveLength(140);
    expect(duplicatesRemoved).toBe(0);
  });
});

describe("filterQuestions", () => {
  const qs: Question[] = [
    base,
    { ...base, id: "T_2", exercise: "III B", difficulty: "hard", target_exam: ["college_exam", "hsc_standard"] },
  ];
  it("returns everything with no criteria", () => {
    expect(filterQuestions(qs, {})).toHaveLength(2);
  });
  it("filters by each criterion", () => {
    expect(filterQuestions(qs, { exercise: "III B" }).map((q) => q.id)).toEqual(["T_2"]);
    expect(filterQuestions(qs, { difficulty: "easy" }).map((q) => q.id)).toEqual(["T_1"]);
    expect(filterQuestions(qs, { targetExam: "college_exam" }).map((q) => q.id)).toEqual(["T_2"]);
    expect(filterQuestions(qs, { exercise: "III A", difficulty: "hard" })).toEqual([]);
  });
});
