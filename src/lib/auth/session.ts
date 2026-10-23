import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "./cookie";
import { resolveCurrentUser, type CurrentUser } from "./current-user";

export type { CurrentUser, EnrolledUser } from "./current-user";

/**
 * The single source of truth for "who is this request?". Every protected
 * page, Server Action and Route Handler calls this itself; proxy only
 * redirects for UX. Deduplicated per request by React `cache`, deliberately
 * NOT `use cache: private`, so a revoked session stops working immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  // Verification compares expiry/revocation against the clock: strictly request-time work.
  await connection();
  return resolveCurrentUser(cookie, {
    verifySession: (value) => adminAuth().verifySessionCookie(value, true),
    loadStudentProfile: async (uid) => {
      const snap = await adminDb().collection("users").doc(uid).get();
      return snap.exists ? snap.data() : null;
    },
  });
});
