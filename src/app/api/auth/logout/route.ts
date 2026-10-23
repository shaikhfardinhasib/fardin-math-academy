import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/cookie";
import { rejectUntrustedRequest } from "@/lib/auth/http";
import { adminAuth } from "@/lib/firebase/admin";

/** Revokes every refresh token for the user (all devices) and clears the cookie. */
export async function POST(request: Request) {
  const rejected = rejectUntrustedRequest(request);
  if (rejected) return rejected;

  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (cookie) {
    try {
      // No revocation check: an already-revoked cookie should still log out cleanly.
      const { uid } = await adminAuth().verifySessionCookie(cookie, false);
      await adminAuth().revokeRefreshTokens(uid);
    } catch {
      // Invalid or expired cookie: nothing to revoke.
    }
  }
  store.delete(SESSION_COOKIE);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
