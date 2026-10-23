import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthShell, { LoadingCard } from "@/features/auth/components/AuthShell";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { CARD_CLASS } from "@/features/auth/components/styles";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "অপেক্ষমাণ - Fardin's Math Academy" };

export default function UnenrolledPage() {
  return (
    <AuthShell>
      <Suspense fallback={<LoadingCard />}>
        <Unenrolled />
      </Suspense>
    </AuthShell>
  );
}

async function Unenrolled() {
  const user = await getCurrentUser();
  if (user.status === "unauthenticated") redirect("/login");
  if (user.status !== "unenrolled") redirect("/");

  return (
    <div className={`${CARD_CLASS} text-center`}>
      <p className="text-4xl" aria-hidden="true">
        ⏳
      </p>
      <h2 className="text-xl font-bold text-slate-800">তোমার শিক্ষক এখনো তোমাকে যুক্ত করেননি</h2>
      <p className="text-sm text-slate-600">
        শিক্ষক তোমাকে ব্যাচে যুক্ত করলে এখানে কুইজ দেখতে পাবে। প্রয়োজনে শিক্ষকের সাথে যোগাযোগ করো।
      </p>
      {user.email && <p className="text-xs text-slate-400 break-all">{user.email}</p>}
      <div className="flex justify-center pt-2">
        <LogoutButton />
      </div>
    </div>
  );
}
