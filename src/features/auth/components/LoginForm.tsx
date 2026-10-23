"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signInWithGoogle, signInWithStudentId } from "../client-session";
import { MESSAGES, messageForError, type Message } from "../messages";
import GoogleIcon from "./GoogleIcon";
import { CARD_CLASS, ERROR_CLASS, INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "./styles";

export default function LoginForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Message | null>(null);

  const run = async (attempt: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await attempt();
      // The server decides the next screen from the new cookie.
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(messageForError(err));
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !password) {
      setError(MESSAGES.missingFields);
      return;
    }
    void run(() => signInWithStudentId(studentId, password));
  };

  return (
    <form noValidate onSubmit={handleSubmit} className={CARD_CLASS}>
      <h2 className="text-xl font-bold text-slate-800">লগইন করো</h2>

      <div>
        <label htmlFor="student-id" className={LABEL_CLASS}>
          স্টুডেন্ট আইডি
        </label>
        <input
          id="student-id"
          type="text"
          inputMode="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={studentId}
          maxLength={40}
          aria-invalid={error !== null}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="উদা: b26a-101"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="password" className={LABEL_CLASS}>
          পাসওয়ার্ড
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          aria-invalid={error !== null}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {error && (
        <p role="alert" className={ERROR_CLASS}>
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={PRIMARY_BUTTON_CLASS}>
        {busy ? "অপেক্ষা করো…" : "লগইন"}
      </button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        অথবা
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button type="button" disabled={busy} onClick={() => void run(signInWithGoogle)} className={SECONDARY_BUTTON_CLASS}>
        <GoogleIcon />
        Google দিয়ে লগইন
      </button>
      <p className="text-xs text-slate-500 text-center">
        Google লগইন কাজ করবে শুধু যদি আগে অ্যাকাউন্ট পাতা থেকে Google যুক্ত করে থাকো।
      </p>
    </form>
  );
}
