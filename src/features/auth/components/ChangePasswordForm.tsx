"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { changePassword } from "../client-session";
import { messageForError, type Message } from "../messages";
import { checkNewPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../password";
import { CARD_CLASS, ERROR_CLASS, INPUT_CLASS, LABEL_CLASS, PRIMARY_BUTTON_CLASS } from "./styles";

export default function ChangePasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Message | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const check = checkNewPassword(password, confirm);
    if (!check.ok) {
      setError(messageForError(check));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await changePassword(password);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(messageForError(err));
      setBusy(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className={CARD_CLASS}>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-800">নতুন পাসওয়ার্ড দাও</h2>
        {forced && (
          <p className="text-sm text-slate-600">
            প্রথমবার লগইন করেছ। শিক্ষকের দেওয়া পাসওয়ার্ডের বদলে নিজের একটি পাসওয়ার্ড ঠিক করো।
          </p>
        )}
      </div>

      <div>
        <label htmlFor="new-password" className={LABEL_CLASS}>
          নতুন পাসওয়ার্ড (কমপক্ষে {PASSWORD_MIN_LENGTH.toLocaleString("bn-BD")} অক্ষর)
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          aria-invalid={error !== null}
          onChange={(e) => setPassword(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className={LABEL_CLASS}>
          আবার লেখো
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          maxLength={PASSWORD_MAX_LENGTH}
          aria-invalid={error !== null}
          onChange={(e) => setConfirm(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {error && (
        <p role="alert" className={ERROR_CLASS}>
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={PRIMARY_BUTTON_CLASS}>
        {busy ? "অপেক্ষা করো…" : "পাসওয়ার্ড পরিবর্তন করো"}
      </button>
    </form>
  );
}
