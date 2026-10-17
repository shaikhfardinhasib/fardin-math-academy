import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, Trophy } from "lucide-react";

interface Props {
  studentName: string;
  score: number;
  total: number;
  seconds: number;
  celebrate: boolean;
  onRestart: () => void;
}

export default function ResultSummary({ studentName, score, total, seconds, celebrate, onRestart }: Props) {
  const celebrated = useRef(false);

  useEffect(() => {
    if (!celebrate || celebrated.current) return;
    celebrated.current = true;
    void confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }, [celebrate]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
        <Trophy aria-hidden className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-800">অভিনন্দন, {studentName}!</h2>
        <p className="text-sm text-slate-500">আপনার কুইজ সম্পন্ন হয়েছে</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl inline-block min-w-[220px]">
        <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider">প্রাপ্ত স্কোর</div>
        <div className="text-3xl font-extrabold text-blue-600 mt-1">
          {score} / {total}
        </div>
        <div className="text-xs text-slate-500 mt-1">সময় লেগেছে: {seconds} সেকেন্ড</div>
      </div>

      <div>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
        >
          <RotateCcw aria-hidden className="w-4 h-4" /> আবার শুরু করুন
        </button>
      </div>
    </div>
  );
}
