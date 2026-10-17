import { z } from "zod";

export const EXERCISES = [
  "III A",
  "III B",
  "III C",
  "III D",
  "III E",
  "III F",
  "III G",
] as const;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const TARGET_EXAMS = [
  "hsc_standard",
  "varsity_admission",
  "engineering_admission",
  "college_exam",
] as const;

const nonEmpty = z
  .string()
  .refine((s) => s.trim().length > 0, { message: "must not be empty" });

export const questionSchema = z.strictObject({
  id: nonEmpty,
  exercise: z.enum(EXERCISES),
  type_name: nonEmpty,
  difficulty: z.enum(DIFFICULTIES),
  target_exam: z.array(z.enum(TARGET_EXAMS)).min(1),
  question: nonEmpty,
  options: z.array(nonEmpty).length(4),
  correct: z.number().int().min(0).max(3),
  // Some questions legitimately have no shortcut; the UI hides the line when empty.
  shortcut_tip: z.string(),
  explanation: nonEmpty,
});

export type Question = z.infer<typeof questionSchema>;
export type Exercise = (typeof EXERCISES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type TargetExam = (typeof TARGET_EXAMS)[number];
