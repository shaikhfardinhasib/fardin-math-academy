import type { Exercise } from "@/lib/questions/schema";

export const ALL_EXERCISES = "ALL" as const;
export type ExerciseChoice = typeof ALL_EXERCISES | Exercise;

export const EXERCISE_OPTIONS: ReadonlyArray<{ value: ExerciseChoice; label: string }> = [
  { value: ALL_EXERCISES, label: "সম্পূর্ণ অধ্যায় (র‍্যান্ডম ১০টি প্রশ্ন)" },
  { value: "III A", label: "অনুশীলনী ৩.১ (III A) - স্থানাঙ্ক ও দূরত্ব" },
  { value: "III B", label: "অনুশীলনী ৩.২ (III B) - বিভক্তিকরণ ও ভরকেন্দ্র" },
  { value: "III C", label: "অনুশীলনী ৩.৩ (III C) - ক্ষেত্রফল" },
  { value: "III D", label: "অনুশীলনী ৩.৪ (III D) - সঞ্চারপথ" },
  { value: "III E", label: "অনুশীলনী ৩.৫ (III E) - রেখার আদর্শ সমীকরণ" },
  { value: "III F", label: "অনুশীলনী ৩.৬ (III F) - সমান্তরাল, লম্ব ও ছেদবিন্দু" },
  { value: "III G", label: "অনুশীলনী ৩.৭ (III G) - দূরত্ব ও সমদ্বিখণ্ডক" },
];

export const QUESTIONS_PER_QUIZ = 10;
