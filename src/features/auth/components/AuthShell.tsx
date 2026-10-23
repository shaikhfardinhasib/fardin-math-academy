import type { ReactNode } from "react";

/** Page frame for the auth screens, matching the home page header. */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Fardin&apos;s Math Academy</h1>
          <p className="text-sm text-slate-500 font-medium">উচ্চতর গণিত প্র্যাকটিস প্ল্যাটফর্ম</p>
        </div>
        {children}
      </div>
    </main>
  );
}

export function LoadingCard() {
  return <p className="text-center text-sm text-slate-500">লোড হচ্ছে…</p>;
}
