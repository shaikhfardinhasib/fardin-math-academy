import {
  getAdditionalUserInfo,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { parseStudentId, studentEmail } from "@/lib/auth/student-id";
import { getClientAuth, studentEmailDomain } from "@/lib/firebase/client";
import { ApiError, postJson } from "./api";

/**
 * Browser half of the session flow: sign in with the client SDK just long
 * enough to get an ID token, hand it to the server for an httpOnly session
 * cookie, then drop the client-side user.
 */

async function exchangeForSession(user: User): Promise<void> {
  try {
    await postJson("/api/auth/session", { idToken: await user.getIdToken() });
  } finally {
    await signOut(getClientAuth());
  }
}

export async function signInWithStudentId(rawId: string, password: string): Promise<void> {
  const id = parseStudentId(rawId);
  if (!id) throw new ApiError("invalid-id-format");
  const cred = await signInWithEmailAndPassword(getClientAuth(), studentEmail(id, studentEmailDomain()), password);
  await exchangeForSession(cred.user);
}

/** Only for accounts that already have Google linked; never creates a student. */
export async function signInWithGoogle(): Promise<void> {
  const auth = getClientAuth();
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  if (getAdditionalUserInfo(cred)?.isNewUser) {
    // Popup sign-in auto-creates unknown Google users; undo that immediately.
    try {
      await cred.user.delete();
    } finally {
      await signOut(auth);
    }
    throw new ApiError("google-not-linked");
  }
  await exchangeForSession(cred.user);
}

/** Re-materialise the session user client-side (via a server-minted custom token). */
async function withSessionUser<T>(fn: (user: User) => Promise<T>): Promise<T> {
  const auth = getClientAuth();
  const { customToken } = await postJson<{ customToken: string }>("/api/auth/custom-token");
  const { user } = await signInWithCustomToken(auth, customToken);
  try {
    return await fn(user);
  } finally {
    await signOut(auth);
  }
}

export function linkGoogleAccount(): Promise<void> {
  // linkWithPopup attaches Google to THIS uid; it fails (never merges) if
  // that Google account already belongs to someone else.
  return withSessionUser(async (user) => {
    await linkWithPopup(user, new GoogleAuthProvider());
  });
}

/** Server changes the password, revokes old sessions and returns a token for a fresh one. */
export async function changePassword(newPassword: string): Promise<void> {
  const { customToken } = await postJson<{ customToken: string }>("/api/auth/change-password", { newPassword });
  const { user } = await signInWithCustomToken(getClientAuth(), customToken);
  await exchangeForSession(user);
}

export async function logout(): Promise<void> {
  await postJson("/api/auth/logout");
}
