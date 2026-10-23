"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { logout } from "../client-session";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await logout();
    } finally {
      // Even if revocation failed, leave; the server re-checks every request.
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-rose-600 disabled:opacity-60 transition"
    >
      <LogOut aria-hidden="true" className="h-4 w-4" />
      লগআউট
    </button>
  );
}
