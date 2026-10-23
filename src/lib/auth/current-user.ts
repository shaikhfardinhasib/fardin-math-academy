import { z } from "zod";

/**
 * Maps a session cookie to the signed-in user's state. Dependencies are
 * injected so the mapping is unit-testable; `session.ts` wires in the real
 * cookie store and Admin SDK.
 *
 * Roles come ONLY from custom claims (set by the Admin SDK). The Firestore
 * profile supplies display data and the mustChangePassword flag, never a role.
 */

export const RoleClaimsSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("teacher") }),
  z.object({ role: z.literal("student"), batchId: z.string().min(1) }),
]);

export type RoleClaims = z.infer<typeof RoleClaimsSchema>;

export const StudentProfileSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  roll: z.string(),
  batchId: z.string().min(1),
  mustChangePassword: z.boolean(),
});

export type StudentProfile = z.infer<typeof StudentProfileSchema>;

export type CurrentUser =
  | { status: "unauthenticated" }
  | { status: "unenrolled"; uid: string; email: string | null }
  | {
      status: "student";
      uid: string;
      studentId: string;
      name: string;
      roll: string;
      batchId: string;
      mustChangePassword: boolean;
    }
  | { status: "teacher"; uid: string; email: string | null; name: string | null; mustChangePassword: false };

export type EnrolledUser = Extract<CurrentUser, { status: "student" | "teacher" }>;

/** The subset of a decoded Firebase token this module reads. */
export interface VerifiedToken {
  uid: string;
  email?: string;
  name?: string;
  auth_time: number;
  [claim: string]: unknown;
}

export interface CurrentUserDeps {
  /** Must verify signature, expiry AND revocation; throws a Firebase `auth/*` error when invalid. */
  verifySession: (cookie: string) => Promise<VerifiedToken>;
  /** users/{uid} via the Admin SDK; null when the doc does not exist. */
  loadStudentProfile: (uid: string) => Promise<unknown>;
}

const UNAUTHENTICATED: CurrentUser = { status: "unauthenticated" };

function isFirebaseAuthError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === "string" && code.startsWith("auth/");
}

export async function resolveCurrentUser(
  cookie: string | undefined,
  deps: CurrentUserDeps,
): Promise<CurrentUser> {
  if (!cookie) return UNAUTHENTICATED;

  let token: VerifiedToken;
  try {
    token = await deps.verifySession(cookie);
  } catch (err) {
    // Expired, revoked, malformed, or the user is disabled/deleted.
    if (isFirebaseAuthError(err)) return UNAUTHENTICATED;
    throw err; // Outage etc.: surface it rather than guess.
  }

  const email = token.email ?? null;
  const claims = RoleClaimsSchema.safeParse(token);
  if (!claims.success) return { status: "unenrolled", uid: token.uid, email };

  if (claims.data.role === "teacher") {
    return { status: "teacher", uid: token.uid, email, name: token.name ?? null, mustChangePassword: false };
  }

  // A student claim without a valid roster entry is treated as not enrolled: no data access.
  const profile = StudentProfileSchema.safeParse(await deps.loadStudentProfile(token.uid));
  if (!profile.success) return { status: "unenrolled", uid: token.uid, email };

  return {
    status: "student",
    uid: token.uid,
    studentId: profile.data.studentId,
    name: profile.data.name,
    roll: profile.data.roll,
    // The claim is authoritative; the doc copy is display data.
    batchId: claims.data.batchId,
    mustChangePassword: profile.data.mustChangePassword,
  };
}
