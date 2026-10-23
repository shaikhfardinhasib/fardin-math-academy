import { readFileSync } from "node:fs";
import { cert, deleteApp, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { resolveAdminConfig, type AdminConfig } from "./admin-config";

/**
 * Admin SDK construction without the `server-only` guard, so the tsx
 * provisioning scripts can use it. App code must import `./admin` instead.
 */

export interface AdminServices {
  config: AdminConfig;
  auth: Auth;
  db: Firestore;
  close: () => Promise<void>;
}

export function createAdminServices(
  env: Record<string, string | undefined> = process.env,
  appName = "fma-admin",
): AdminServices {
  const config = resolveAdminConfig(env, (p) => readFileSync(p, "utf8"));
  const app: App =
    config.mode === "emulator"
      ? // The SDK reads FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST itself.
        initializeApp({ projectId: config.projectId }, appName)
      : initializeApp(
          {
            projectId: config.projectId,
            credential: cert({
              projectId: config.serviceAccount.project_id,
              clientEmail: config.serviceAccount.client_email,
              privateKey: config.serviceAccount.private_key,
            }),
          },
          appName,
        );
  return { config, auth: getAuth(app), db: getFirestore(app), close: () => deleteApp(app) };
}
