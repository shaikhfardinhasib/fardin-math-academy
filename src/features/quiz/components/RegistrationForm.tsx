import { useState, type FormEvent } from "react";
import { NAME_MAX_LENGTH, ROLL_MAX_LENGTH, validateRegistration } from "../domain/registration";
import type { Student } from "../domain/types";
import { ALL_EXERCISES, EXERCISE_OPTIONS, type ExerciseChoice } from "../exercises";
import type { StartResult } from "../hooks/useQuizSession";

interface Props {
  initial?: { name: string; roll: string; exercise: ExerciseChoice };
  onStart: (student: Student, exercise: ExerciseChoice) => StartResult;
}

const MISSING_FIELDS_MESSAGE = "দয়া করে নাম এবং রোল/আইডি লিখুন!";
const NO_QUESTIONS_MESSAGE = "এই অনুশীলনীতে প্রশ্ন পাওয়া যায়নি!";

const INPUT_CLASS =
  "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition aria-[invalid=true]:border-rose-500";
const LABEL_CLASS = "block text-xs font-semibold text-slate-500 uppercase mb-1";

export default function RegistrationForm({ initial, onStart }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [roll, setRoll] = useState(initial?.roll ?? "");
  const [exercise, setExercise] = useState<ExerciseChoice>(initial?.exercise ?? ALL_EXERCISES);
  const [error, setError] = useState<{ message: string; name: boolean; roll: boolean } | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateRegistration({ name, roll });
    if (!result.ok) {
      setError({ message: MISSING_FIELDS_MESSAGE, ...result.missing });
      return;
    }
    const started = onStart(result.student, exercise);
    if (!started.ok) setError({ message: NO_QUESTIONS_MESSAGE, name: false, roll: false });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5"
    >
      <h2 className="text-xl font-bold text-slate-800">কুইজে অংশ নিতে তথ্য দিন</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="student-name" className={LABEL_CLASS}>
            শিক্ষার্থীর নাম
          </label>
          <input
            id="student-name"
            type="text"
            value={name}
            maxLength={NAME_MAX_LENGTH}
            aria-invalid={error?.name ?? false}
            onChange={(e) => setName(e.target.value)}
            placeholder="উদা: তাহমিদ হাসান"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="student-roll" className={LABEL_CLASS}>
            রোল / ব্যাচ আইডি
          </label>
          <input
            id="student-roll"
            type="text"
            value={roll}
            maxLength={ROLL_MAX_LENGTH}
            aria-invalid={error?.roll ?? false}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="উদা: 101"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label htmlFor="exercise" className={LABEL_CLASS}>
          অনুশীলনী নির্বাচন করুন
        </label>
        <select
          id="exercise"
          value={exercise}
          onChange={(e) => setExercise(e.target.value as ExerciseChoice)}
          className={`${INPUT_CLASS} bg-white`}
        >
          {EXERCISE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-rose-600">
          {error.message}
        </p>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-sm"
      >
        কুইজ শুরু করুন
      </button>
    </form>
  );
}
