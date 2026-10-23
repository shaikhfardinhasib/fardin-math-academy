import { z } from "zod";
import { adminUsesEmulators, EnvConfigError } from "./env";

/**
 * Decides how the Admin SDK is initialised. Pure (env + file reader are
 * injected) so the scripts, the server and the tests share one code path.
 */

const ServiceAccountSchema = z.object({
  project_id: z.string().min(1),
  client_email: z.string().email(),
  private_key: z.string().min(1),
});

export type ServiceAccount = z.infer<typeof ServiceAccountSchema>;

export type AdminConfig =
  | { mode: "emulator"; projectId: string }
  | { mode: "production"; projectId: string; serviceAccount: ServiceAccount };

type Env = Record<string, string | undefined>;

function parseServiceAccount(json: string, source: string): ServiceAccount {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    // Never echo the content: it is a private key.
    throw new EnvConfigError([`${source} is not valid JSON`]);
  }
  const parsed = ServiceAccountSchema.safeParse(raw);
  if (!parsed.success) {
    throw new EnvConfigError([`${source} is missing project_id, client_email or private_key`]);
  }
  return parsed.data;
}

export function resolveAdminConfig(env: Env, readFile: (path: string) => string): AdminConfig {
  if (adminUsesEmulators(env)) {
    const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? env.GCLOUD_PROJECT;
    if (!projectId?.startsWith("demo-")) {
      throw new EnvConfigError([
        `emulator hosts are set but the project ID is "${projectId ?? "(unset)"}"; use a demo- project`,
      ]);
    }
    return { mode: "emulator", projectId };
  }

  let serviceAccount: ServiceAccount;
  if (env.FIREBASE_ADMIN_CREDENTIALS_PATH) {
    const path = env.FIREBASE_ADMIN_CREDENTIALS_PATH;
    let json: string;
    try {
      json = readFile(path);
    } catch {
      throw new EnvConfigError([`cannot read FIREBASE_ADMIN_CREDENTIALS_PATH (${path})`]);
    }
    serviceAccount = parseServiceAccount(json, "FIREBASE_ADMIN_CREDENTIALS_PATH");
  } else if (env.FIREBASE_ADMIN_CREDENTIALS_BASE64) {
    const json = Buffer.from(env.FIREBASE_ADMIN_CREDENTIALS_BASE64, "base64").toString("utf8");
    serviceAccount = parseServiceAccount(json, "FIREBASE_ADMIN_CREDENTIALS_BASE64");
  } else {
    throw new EnvConfigError([
      "no Admin credentials: set FIREBASE_ADMIN_CREDENTIALS_PATH (local) or FIREBASE_ADMIN_CREDENTIALS_BASE64 (deployment), or set the emulator hosts",
    ]);
  }

  const expected = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (expected && expected !== serviceAccount.project_id) {
    throw new EnvConfigError([
      `service account belongs to "${serviceAccount.project_id}" but NEXT_PUBLIC_FIREBASE_PROJECT_ID is "${expected}"`,
    ]);
  }
  return { mode: "production", projectId: serviceAccount.project_id, serviceAccount };
}
