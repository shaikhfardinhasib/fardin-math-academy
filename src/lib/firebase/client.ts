import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import {
  browserPopupRedirectResolver,
  connectAuthEmulator,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";

/**
 * Browser-side Firebase. The httpOnly session cookie is the source of truth,
 * so the client SDK keeps no persisted state (inMemoryPersistence): it signs
 * in only long enough to hand an ID token to the server.
 *
 * NEXT_PUBLIC_* values must be referenced literally so Next can inline them.
 */
function clientOptions(): FirebaseOptions {
  const options = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const missing = Object.entries(options)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`Missing NEXT_PUBLIC_FIREBASE_* config: ${missing.join(", ")}`);
  }
  return options;
}

export const firebaseEmulatorsEnabled = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

let auth: Auth | undefined;

export function getClientAuth(): Auth {
  if (auth) return auth;
  const app = getApps()[0] ?? initializeApp(clientOptions());
  auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  if (firebaseEmulatorsEnabled) {
    connectAuthEmulator(
      auth,
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ?? "http://127.0.0.1:9099",
      { disableWarnings: true },
    );
  }
  return auth;
}

/** Domain for synthetic student emails; the server's startup check validates it. */
export function studentEmailDomain(): string {
  const domain = process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN;
  if (!domain) throw new Error("Missing NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN");
  return domain;
}
