import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthShell from "@/features/auth/components/AuthShell";
import LoginForm from "@/features/auth/components/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "লগইন - Fardin's Math Academy" };

export default function LoginPage() {
  return (
    <AuthShell>
      {/* The form is static; only the "already signed in?" check waits for the request. */}
      <LoginForm />
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
    </AuthShell>
  );
}

async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user.status === "unenrolled") redirect("/unenrolled");
  if (user.status !== "unauthenticated") redirect("/");
  return null;
}
