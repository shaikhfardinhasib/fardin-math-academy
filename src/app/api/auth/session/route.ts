import { cookies } from "next/headers";
import { z } from "zod";
import { RECENT_SIGN_IN_SECONDS, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, sessionCookieOptions } from "@/lib/auth/cookie";
import { jsonError, readJsonBody, rejectUntrustedRequest } from "@/lib/auth/http";
import { adminAuth } from "@/lib/firebase/admin";

const BodySchema = z.object({ idToken: z.string().min(1).max(8192) });

/** Exchanges a fresh Firebase ID token for an httpOnly session cookie. */
export async function POST(request: Request) {
  const rejected = rejectUntrustedRequest(request);
  if (rejected) return rejected;

  const body = await readJsonBody(request, BodySchema);
  if (!body) return jsonError(400, "bad-request");

  let authTime: number;
  try {
    authTime = (await adminAuth().verifyIdToken(body.idToken, true)).auth_time;
  } catch {
    return jsonError(401, "invalid-token");
  }
  // Only mint a long-lived cookie right after an actual sign-in.
  if (Date.now() / 1000 - authTime > RECENT_SIGN_IN_SECONDS) return jsonError(401, "stale-sign-in");

  const sessionCookie = await adminAuth().createSessionCookie(body.idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
  (await cookies()).set(SESSION_COOKIE, sessionCookie, sessionCookieOptions());
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
