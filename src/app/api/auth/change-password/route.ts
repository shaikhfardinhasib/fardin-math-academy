import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { NewPasswordSchema } from "@/features/auth/password";
import { RECENT_SIGN_IN_SECONDS } from "@/lib/auth/cookie";
import { jsonError, readJsonBody, rejectUntrustedRequest } from "@/lib/auth/http";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const BodySchema = z.object({ newPassword: z.string() });

/**
 * Sets a new password via the Admin SDK, clears mustChangePassword, and
 * revokes every existing session. Returns a custom token so the browser can
 * immediately open a fresh session.
 */
export async function POST(request: Request) {
  const rejected = rejectUntrustedRequest(request);
  if (rejected) return rejected;

  const user = await getCurrentUser();
  if (user.status === "unauthenticated") return jsonError(401, "unauthenticated");
  if (user.status !== "student") return jsonError(403, "forbidden");
  // A forgotten, still-open session must not be able to lock the student out.
  if (Date.now() / 1000 - user.authTime > RECENT_SIGN_IN_SECONDS) return jsonError(401, "reauth-required");

  const body = await readJsonBody(request, BodySchema);
  if (!body) return jsonError(400, "bad-request");
  const password = NewPasswordSchema.safeParse(body.newPassword);
  if (!password.success) return jsonError(400, password.error.issues[0]?.message ?? "bad-request");

  const auth = adminAuth();
  await auth.updateUser(user.uid, { password: password.data });
  // Password first: if this write fails the student is simply asked again.
  await adminDb().collection("users").doc(user.uid).update({
    mustChangePassword: false,
    passwordChangedAt: FieldValue.serverTimestamp(),
  });
  await auth.revokeRefreshTokens(user.uid);

  const customToken = await auth.createCustomToken(user.uid);
  return Response.json({ ok: true, customToken }, { headers: { "Cache-Control": "no-store" } });
}
