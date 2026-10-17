import QuizApp from "@/features/quiz/components/QuizApp";
import { loadQuestions } from "@/lib/questions/load";

export default function Home() {
  // Validated and deduplicated on the server; throws at build time on bad data.
  const questions = loadQuestions();

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

        <QuizApp questions={questions} />
      </div>
    </main>
  );
}
