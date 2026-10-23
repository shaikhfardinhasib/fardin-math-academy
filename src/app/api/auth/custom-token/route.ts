import { jsonError, rejectUntrustedRequest } from "@/lib/auth/http";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * Lets the browser act as the session's own user (e.g. linkWithPopup) while
 * the client SDK keeps no persisted state. Same uid only, no extra claims.
 */
export async function POST(request: Request) {
  const rejected = rejectUntrustedRequest(request);
  if (rejected) return rejected;

  const user = await getCurrentUser();
  if (user.status === "unauthenticated") return jsonError(401, "unauthenticated");
  if (user.status === "unenrolled") return jsonError(403, "unenrolled");
  if (user.mustChangePassword) return jsonError(403, "must-change-password");

  const customToken = await adminAuth().createCustomToken(user.uid);
  return Response.json({ ok: true, customToken }, { headers: { "Cache-Control": "no-store" } });
}
