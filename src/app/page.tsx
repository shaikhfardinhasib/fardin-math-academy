"use client";

import { useState, useEffect } from "react";
import MathText from "@/components/math/MathText";
import confetti from "canvas-confetti";
import { Trophy, Timer, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface Question {
  id: string;
  exercise: string;
  type_name: string;
  difficulty: "easy" | "medium" | "hard";
  target_exam: string[];
  question: string;
  options: string[];
  correct: number;
  shortcut_tip: string;
  explanation: string;
}

export default function Home() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [quizSet, setQuizSet] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Form State
  const [studentName, setStudentName] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("ALL");

  // Load JSON Questions
  useEffect(() => {
    fetch("/all_straight_lines.json")
      .then((res) => res.json())
      .then((data) => setAllQuestions(data))
      .catch((err) => console.error("Error loading JSON:", err));
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQuizActive && !isFinished) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isQuizActive, isFinished]);

  const startQuiz = () => {
    if (!studentName.trim() || !studentRoll.trim()) {
      alert("দয়া করে নাম এবং রোল/আইডি লিখুন!");
      return;
    }

    const pool =
      selectedExercise === "ALL"
        ? allQuestions
        : allQuestions.filter((q) => q.exercise === selectedExercise);

    if (pool.length === 0) {
      alert("এই অনুশীলনীতে প্রশ্ন পাওয়া যায়নি!");
      return;
    }

    // Shuffle and pick 10 questions
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
    setQuizSet(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setTimer(0);
    setSelectedOption(null);
    setIsQuizActive(true);
    setIsFinished(false);
  };

  const handleOptionClick = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);

    if (idx === quizSet[currentIdx].correct) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < quizSet.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      setIsQuizActive(false);

      if (score + (selectedOption === quizSet[currentIdx].correct ? 0 : 0) >= 8) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const currentQ = quizSet[currentIdx];

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            Fardin&apos;s Math Academy
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            উচ্চতর গণিত ১ম পত্র • সরলরেখা প্র্যাকটিস প্ল্যাটফর্ম
          </p>
        </div>

        {/* 1. Registration Screen */}
        {!isQuizActive && !isFinished && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <h2 className="text-xl font-bold text-slate-800">
              কুইজে অংশ নিতে তথ্য দিন
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  শিক্ষার্থীর নাম
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="উদা: তাহমিদ হাসান"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  রোল / ব্যাচ আইডি
                </label>
                <input
                  type="text"
                  value={studentRoll}
                  onChange={(e) => setStudentRoll(e.target.value)}
                  placeholder="উদা: 101"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                অনুশীলনী নির্বাচন করুন
              </label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition bg-white"
              >
                <option value="ALL">সম্পূর্ণ অধ্যায় (র‍্যান্ডম ১০টি প্রশ্ন)</option>
                <option value="III A">অনুশীলনী ৩.১ (III A) - স্থানাঙ্ক ও দূরত্ব</option>
                <option value="III B">অনুশীলনী ৩.২ (III B) - বিভক্তিকরণ ও ভরকেন্দ্র</option>
                <option value="III C">অনুশীলনী ৩.৩ (III C) - ক্ষেত্রফল</option>
                <option value="III D">অনুশীলনী ৩.৪ (III D) - সঞ্চারপথ</option>
                <option value="III E">অনুশীলনী ৩.৫ (III E) - রেখার আদর্শ সমীকরণ</option>
                <option value="III F">অনুশীলনী ৩.৬ (III F) - সমান্তরাল, লম্ব ও ছেদবিন্দু</option>
                <option value="III G">অনুশীলনী ৩.৭ (III G) - দূরত্ব ও সমদ্বিখণ্ডক</option>
              </select>
            </div>

            <button
              onClick={startQuiz}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-sm"
            >
              কুইজ শুরু করুন
            </button>
          </div>
        )}

        {/* 2. Active Quiz Screen */}
        {isQuizActive && currentQ && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-sm font-bold text-slate-800">
                  {studentName}
                </span>
                <span className="block text-xs text-blue-600 font-medium">
                  {currentQ.exercise} • {currentQ.type_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                  <Timer className="w-3.5 h-3.5" /> {timer}s
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                  {currentIdx + 1} / {quizSet.length}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
              <MathText text={currentQ.question} />
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                let btnStyle =
                  "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700";

                if (selectedOption !== null) {
                  if (idx === currentQ.correct) {
                    btnStyle =
                      "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                  } else if (idx === selectedOption) {
                    btnStyle =
                      "border-rose-500 bg-rose-50 text-rose-900 font-semibold";
                  } else {
                    btnStyle = "border-slate-200 opacity-50";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={selectedOption !== null}
                    onClick={() => handleOptionClick(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-sm transition flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <MathText text={opt} />
                    </div>
                    {selectedOption !== null && idx === currentQ.correct && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {selectedOption === idx && idx !== currentQ.correct && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Box */}
            {selectedOption !== null && (
              <div
                className={`p-4 rounded-xl text-xs sm:text-sm border leading-relaxed space-y-2 ${
                  selectedOption === currentQ.correct
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-rose-50 border-rose-200 text-rose-950"
                }`}
              >
                {currentQ.shortcut_tip && (
                  <p>
                    <span className="font-bold">⚡ শর্টকাট টিপ: </span>
                    <MathText text={currentQ.shortcut_tip} />
                  </p>
                )}
                <p>
                  <span className="font-bold">ব্যাখ্যা: </span>
                  <MathText text={currentQ.explanation} />
                </p>
              </div>
            )}

            {/* Next Button */}
            {selectedOption !== null && (
              <button
                onClick={nextQuestion}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {currentIdx + 1 === quizSet.length
                  ? "ফলাফল দেখুন"
                  : "পরবর্তী প্রশ্ন"}
              </button>
            )}
          </div>
        )}

        {/* 3. Result Screen */}
        {isFinished && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-800">
                অভিনন্দন, {studentName}!
              </h2>
              <p className="text-sm text-slate-500">আপনার কুইজ সম্পন্ন হয়েছে</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl inline-block min-w-[220px]">
              <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
                প্রাপ্ত স্কোর
              </div>
              <div className="text-3xl font-extrabold text-blue-600 mt-1">
                {score} / {quizSet.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                সময় লেগেছে: {timer} সেকেন্ড
              </div>
            </div>

            <div>
              <button
                onClick={() => {
                  setIsFinished(false);
                  setIsQuizActive(false);
                }}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              >
                <RotateCcw className="w-4 h-4" /> আবার শুরু করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}