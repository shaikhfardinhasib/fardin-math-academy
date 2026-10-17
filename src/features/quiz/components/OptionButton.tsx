import { CheckCircle2, XCircle } from "lucide-react";
import MathText from "@/components/math/MathText";

export type OptionStatus = "idle" | "correct" | "wrong" | "dimmed";

interface Props {
  index: number;
  text: string;
  status: OptionStatus;
  /** True for the option the student picked. */
  selected: boolean;
  disabled: boolean;
  onSelect: (index: number) => void;
}

const STYLES: Record<OptionStatus, string> = {
  idle: "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700",
  correct: "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold",
  wrong: "border-rose-500 bg-rose-50 text-rose-900 font-semibold",
  dimmed: "border-slate-200 opacity-50",
};

export default function OptionButton({ index, text, status, selected, disabled, onSelect }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(index)}
      className={`w-full text-left p-3.5 rounded-xl border text-sm transition flex items-center justify-between ${STYLES[status]}`}
    >
      <div className="flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
          {String.fromCharCode(65 + index)}
        </span>
        <MathText text={text} />
      </div>
      {status === "correct" && <CheckCircle2 aria-hidden className="w-5 h-5 text-emerald-600 shrink-0" />}
      {status === "wrong" && <XCircle aria-hidden className="w-5 h-5 text-rose-600 shrink-0" />}
    </button>
  );
}
