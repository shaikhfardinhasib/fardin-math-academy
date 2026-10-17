import { Timer } from "lucide-react";

interface Props {
  studentName: string;
  exercise: string;
  typeName: string;
  elapsedSeconds: number;
  position: number;
  total: number;
}

export default function QuizHeader({ studentName, exercise, typeName, elapsedSeconds, position, total }: Props) {
  return (
    <div className="flex justify-between items-center border-b pb-4">
      <div>
        <span className="text-sm font-bold text-slate-800">{studentName}</span>
        <span className="block text-xs text-blue-600 font-medium">
          {exercise} • {typeName}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* aria-live="off": a ticking timer must not be announced every second. */}
        <span
          aria-live="off"
          className="flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-semibold"
        >
          <Timer aria-hidden className="w-3.5 h-3.5" /> {elapsedSeconds}s
        </span>
        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
          {position} / {total}
        </span>
      </div>
    </div>
  );
}
