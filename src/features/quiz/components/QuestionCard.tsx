import MathText from "@/components/math/MathText";
import type { SessionQuestion } from "../domain/types";
import ExplanationPanel from "./ExplanationPanel";
import OptionButton, { type OptionStatus } from "./OptionButton";

interface Props {
  question: SessionQuestion;
  /** The option the student picked, or null while unanswered. */
  selectedIndex: number | null;
  isLast: boolean;
  onAnswer: (index: number) => void;
  onNext: () => void;
}

function statusOf(index: number, question: SessionQuestion, selectedIndex: number | null): OptionStatus {
  if (selectedIndex === null) return "idle";
  if (index === question.correctIndex) return "correct";
  if (index === selectedIndex) return "wrong";
  return "dimmed";
}

/** Renders as a fragment so the parent card's vertical spacing applies. */
export default function QuestionCard({ question, selectedIndex, isLast, onAnswer, onNext }: Props) {
  const answered = selectedIndex !== null;

  return (
    <>
      <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
        <MathText text={question.source.question} />
      </div>

      <div className="space-y-3">
        {question.options.map((text, index) => (
          <OptionButton
            key={index}
            index={index}
            text={text}
            status={statusOf(index, question, selectedIndex)}
            selected={selectedIndex === index}
            disabled={answered}
            onSelect={onAnswer}
          />
        ))}
      </div>

      {answered && (
        <>
          <ExplanationPanel
            isCorrect={selectedIndex === question.correctIndex}
            shortcutTip={question.source.shortcut_tip}
            explanation={question.source.explanation}
          />
          <button
            type="button"
            onClick={onNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {isLast ? "ফলাফল দেখুন" : "পরবর্তী প্রশ্ন"}
          </button>
        </>
      )}
    </>
  );
}
