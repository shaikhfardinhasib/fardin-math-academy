import { Suspense } from "react";
import QuizApp from "@/features/quiz/components/QuizApp";
import { requireEnrolledUser } from "@/lib/auth/guards";
import { loadQuestions } from "@/lib/questions/load";

// Module scope: validated and deduplicated when the route is built, so bad data
// still fails the build even though the page itself now renders per request.
const questions = loadQuestions();

export default function Home() {
  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Fardin&apos;s Math Academy
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            উচ্চতর গণিত ১ম পত্র • সরলরেখা প্র্যাকটিস প্ল্যাটফর্ম
          </p>
        </div>

        {/* The session read happens at request time, so it streams in behind the boundary. */}
        <Suspense fallback={<p className="text-center text-sm text-slate-500">লোড হচ্ছে…</p>}>
          <AuthorizedQuiz />
        </Suspense>
      </div>
    </main>
  );
}

async function AuthorizedQuiz() {
  // Authorize before any question data is rendered into the response.
  await requireEnrolledUser();
  return <QuizApp questions={questions} />;
}
