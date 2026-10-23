import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import AuthShell, { LoadingCard } from "@/features/auth/components/AuthShell";
import LinkGoogleButton from "@/features/auth/components/LinkGoogleButton";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { CARD_CLASS } from "@/features/auth/components/styles";
import { requireEnrolledUser } from "@/lib/auth/guards";
import { adminAuth } from "@/lib/firebase/admin";

export const metadata: Metadata = { title: "অ্যাকাউন্ট - Fardin's Math Academy" };

export default function AccountPage() {
  return (
    <AuthShell>
      <Suspense fallback={<LoadingCard />}>
        <Account />
      </Suspense>
    </AuthShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800 text-right break-all">{value}</dd>
    </div>
  );
}

async function Account() {
  const user = await requireEnrolledUser();
  const record = await adminAuth().getUser(user.uid);
  const google = record.providerData.find((p) => p.providerId === "google.com");

  return (
    <>
      <section className={CARD_CLASS}>
        <h2 className="text-xl font-bold text-slate-800">অ্যাকাউন্ট</h2>
        <dl className="space-y-2">
          {user.status === "student" ? (
            <>
              <Row label="নাম" value={user.name} />
              <Row label="স্টুডেন্ট আইডি" value={user.studentId} />
              <Row label="রোল" value={user.roll} />
              <Row label="ব্যাচ" value={user.batchId} />
            </>
          ) : (
            <>
              <Row label="ভূমিকা" value="শিক্ষক" />
              {user.email && <Row label="ইমেইল" value={user.email} />}
            </>
          )}
        </dl>
      </section>

      {user.status === "student" && (
        <section className={CARD_CLASS}>
          <h2 className="text-lg font-bold text-slate-800">Google লগইন</h2>
          {google ? (
            <p className="text-sm text-slate-600">
              যুক্ত আছে: <span className="font-semibold break-all">{google.email ?? google.uid}</span>
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Google অ্যাকাউন্ট যুক্ত করলে আইডি-পাসওয়ার্ড ছাড়াও Google দিয়ে লগইন করতে পারবে।
              </p>
              <LinkGoogleButton />
            </>
          )}
          <Link href="/change-password" className="block text-sm font-semibold text-blue-700 hover:underline">
            পাসওয়ার্ড পরিবর্তন করো
          </Link>
        </section>
      )}

      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">
          ← কুইজে ফিরে যাও
        </Link>
        <LogoutButton />
      </div>
    </>
  );
}
