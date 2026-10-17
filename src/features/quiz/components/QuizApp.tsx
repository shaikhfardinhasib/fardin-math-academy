"use client";

import { useState } from "react";
import type { Question } from "@/lib/questions/schema";
import { score, shouldCelebrate, elapsedSeconds } from "../domain/selectors";
import type { QuizConfig, Student } from "../domain/types";
import { ALL_EXERCISES, QUESTIONS_PER_QUIZ, type ExerciseChoice } from "../exercises";
import { useElapsedTime } from "../hooks/useElapsedTime";
import { useQuizSession, type StartResult } from "../hooks/useQuizSession";
import QuestionCard from "./QuestionCard";
import QuizHeader from "./QuizHeader";
import RegistrationForm from "./RegistrationForm";
import ResultSummary from "./ResultSummary";

interface Props {
  questions: Question[];
}

interface LastRegistration {
  name: string;
  roll: string;
  exercise: ExerciseChoice;
}

export default function QuizApp({ questions }: Props) {
  const { state, start, answer, next, reset } = useQuizSession(questions);
  // Lets the form come back pre-filled after "আবার শুরু করুন".
  const [last, setLast] = useState<LastRegistration | undefined>();
  const elapsed = useElapsedTime(state.status === "inProgress" ? state.startedAt : null);

  const handleStart = (student: Student, exercise: ExerciseChoice): StartResult => {
    setLast({ ...student, exercise });
    const config: QuizConfig =
      exercise === ALL_EXERCISES
        ? { mode: "chapter", count: QUESTIONS_PER_QUIZ }
        : { mode: "exercise", exercise, count: QUESTIONS_PER_QUIZ };
    return start(student, config);
  };

  if (state.status === "registration") {
    return <RegistrationForm initial={last} onStart={handleStart} />;
  }

  if (state.status === "finished") {
    return (
      <ResultSummary
        studentName={state.student.name}
        score={score(state.answers)}
        total={state.questions.length}
        seconds={elapsedSeconds(state.startedAt, state.finishedAt)}
        celebrate={shouldCelebrate(state.answers, state.questions.length)}
        onRestart={reset}
      />
    );
  }

  const question = state.questions[state.currentIndex];
  if (!question) return null;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <QuizHeader
        studentName={state.student.name}
        exercise={question.source.exercise}
        typeName={question.source.type_name}
        elapsedSeconds={elapsed}
        position={state.currentIndex + 1}
        total={state.questions.length}
      />
      <QuestionCard
        // New question → fresh subtree (no stale focus / memo state).
        key={question.id}
        question={question}
        selectedIndex={state.answers[state.currentIndex]?.selectedIndex ?? null}
        isLast={state.currentIndex + 1 === state.questions.length}
        onAnswer={answer}
        onNext={next}
      />
    </div>
  );
}
