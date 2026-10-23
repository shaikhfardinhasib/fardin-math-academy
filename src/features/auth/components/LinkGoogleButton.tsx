"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { linkGoogleAccount } from "../client-session";
import { MESSAGES, messageForError, type Message } from "../messages";
import GoogleIcon from "./GoogleIcon";
import { ERROR_CLASS, SECONDARY_BUTTON_CLASS, SUCCESS_CLASS } from "./styles";

export default function LinkGoogleButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: Message } | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setResult(null);
    try {
      await linkGoogleAccount();
      setResult({ ok: true, message: MESSAGES.googleLinked });
      router.refresh();
    } catch (err) {
      setResult({ ok: false, message: messageForError(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <button type="button" disabled={busy} onClick={handleClick} className={SECONDARY_BUTTON_CLASS}>
        <GoogleIcon />
        {busy ? "অপেক্ষা করো…" : "Google অ্যাকাউন্ট যুক্ত করো"}
      </button>
      {result && (
        <p role={result.ok ? "status" : "alert"} className={result.ok ? SUCCESS_CLASS : ERROR_CLASS}>
          {result.message}
        </p>
      )}
    </div>
  );
}
