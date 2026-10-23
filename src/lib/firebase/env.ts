import { z } from "zod";

/**
 * Pure environment checks shared by the Next server (via instrumentation),
 * the Admin SDK init and the provisioning scripts. Takes the env as an
 * argument so it can be unit-tested and never touches `process` itself.
 */

/** Reserved TLD (RFC 2606); allowed only while every service is emulated. */
export const PLACEHOLDER_STUDENT_EMAIL_DOMAIN = "students.example.invalid";

type Env = Record<string, string | undefined>;

export class EnvConfigError extends Error {
  constructor(problems: string[]) {
    super(`Invalid Firebase environment:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "EnvConfigError";
  }
}

const DomainSchema = z
  .string()
  .regex(/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/, "not a lowercase DNS domain");

/** True when the Admin SDK should talk to the emulators (both hosts set). */
export function adminUsesEmulators(env: Env): boolean {
  return Boolean(env.FIREBASE_AUTH_EMULATOR_HOST || env.FIRESTORE_EMULATOR_HOST);
}

/**
 * Validates the server-side view of the environment and returns the student
 * email domain. Throws EnvConfigError listing every problem at once.
 */
export function checkServerEnv(env: Env): { emulators: boolean; studentEmailDomain: string } {
  const problems: string[] = [];
  const emulators = adminUsesEmulators(env);
  const clientEmulators = env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  if (emulators && !(env.FIREBASE_AUTH_EMULATOR_HOST && env.FIRESTORE_EMULATOR_HOST)) {
    problems.push(
      "set both FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST, or neither (one would hit the real project)",
    );
  }
  if (emulators !== clientEmulators) {
    problems.push(
      `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=${env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS ?? "(unset)"} disagrees with the Admin emulator hosts; client and server must target the same backend`,
    );
  }

  const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) problems.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID is required");
  else if (emulators && !projectId.startsWith("demo-")) {
    problems.push(`emulator mode requires a demo- project ID (got "${projectId}")`);
  } else if (!emulators && projectId.startsWith("demo-")) {
    problems.push(`a demo- project ID ("${projectId}") cannot be used without the emulators`);
  }

  const domain = env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN ?? "";
  if (!DomainSchema.safeParse(domain).success) {
    problems.push(`NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN must be a lowercase domain (got "${domain}")`);
  } else if (!emulators && domain === PLACEHOLDER_STUDENT_EMAIL_DOMAIN) {
    problems.push(
      `NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN is still the placeholder "${PLACEHOLDER_STUDENT_EMAIL_DOMAIN}"; set the real domain before running against a real project`,
    );
  }

  if (problems.length > 0) throw new EnvConfigError(problems);
  return { emulators, studentEmailDomain: domain };
}
