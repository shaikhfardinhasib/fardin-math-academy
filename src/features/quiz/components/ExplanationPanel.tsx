import MathText from "@/components/math/MathText";

interface Props {
  isCorrect: boolean;
  shortcutTip: string;
  explanation: string;
}

export default function ExplanationPanel({ isCorrect, shortcutTip, explanation }: Props) {
  return (
    <div
      className={`p-4 rounded-xl text-xs sm:text-sm border leading-relaxed space-y-2 ${
        isCorrect
          ? "bg-emerald-50 border-emerald-200 text-emerald-950"
          : "bg-rose-50 border-rose-200 text-rose-950"
      }`}
    >
      {shortcutTip && (
        <p>
          <span className="font-bold">⚡ শর্টকাট টিপ: </span>
          <MathText text={shortcutTip} />
        </p>
      )}
      <p>
        <span className="font-bold">ব্যাখ্যা: </span>
        <MathText text={explanation} />
      </p>
    </div>
  );
}
