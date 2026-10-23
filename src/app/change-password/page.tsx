import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthShell, { LoadingCard } from "@/features/auth/components/AuthShell";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";
import LogoutButton from "@/features/auth/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "পাসওয়ার্ড পরিবর্তন - Fardin's Math Academy" };

export default function ChangePasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<LoadingCard />}>
        <ChangePassword />
      </Suspense>
    </AuthShell>
  );
}

async function ChangePassword() {
  const user = await getCurrentUser();
  if (user.status === "unauthenticated") redirect("/login");
  if (user.status === "unenrolled") redirect("/unenrolled");
  // Only provisioned (password) accounts have a password to change.
  if (user.status !== "student") redirect("/");

  return (
    <>
      <ChangePasswordForm forced={user.mustChangePassword} />
      <div className="flex justify-center">
        <LogoutButton />
      </div>
    </>
  );
}
