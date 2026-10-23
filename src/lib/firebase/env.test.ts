import { describe, expect, it } from "vitest";
import { resolveAdminConfig } from "./admin-config";
import { checkServerEnv, EnvConfigError, PLACEHOLDER_STUDENT_EMAIL_DOMAIN } from "./env";

const emulatorEnv = {
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-fma",
  NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN: PLACEHOLDER_STUDENT_EMAIL_DOMAIN,
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
};

const prodEnv = {
  NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "false",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "real-project",
  NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN: "students.example.com",
};

const serviceAccount = JSON.stringify({
  project_id: "real-project",
  client_email: "sa@real-project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----\n",
});

const noFile = () => {
  throw new Error("ENOENT");
};

describe("checkServerEnv", () => {
  it("accepts the emulator example", () => {
    expect(checkServerEnv(emulatorEnv)).toEqual({
      emulators: true,
      studentEmailDomain: PLACEHOLDER_STUDENT_EMAIL_DOMAIN,
    });
  });

  it("refuses the placeholder domain when emulators are off", () => {
    expect(() =>
      checkServerEnv({ ...prodEnv, NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN: PLACEHOLDER_STUDENT_EMAIL_DOMAIN }),
    ).toThrow(/placeholder/);
  });

  it("accepts a real domain when emulators are off", () => {
    expect(checkServerEnv(prodEnv).emulators).toBe(false);
  });

  it("refuses half-configured emulators and client/server mismatch", () => {
    expect(() => checkServerEnv({ ...emulatorEnv, FIRESTORE_EMULATOR_HOST: undefined })).toThrow(/both/);
    expect(() => checkServerEnv({ ...emulatorEnv, NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "false" })).toThrow(
      /disagrees/,
    );
  });

  it("requires demo- projects with emulators and forbids them without", () => {
    expect(() => checkServerEnv({ ...emulatorEnv, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "real-project" })).toThrow(
      /demo-/,
    );
    expect(() => checkServerEnv({ ...prodEnv, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-fma" })).toThrow(/demo-/);
  });

  it("rejects malformed domains", () => {
    expect(() => checkServerEnv({ ...emulatorEnv, NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN: "Not A Domain" })).toThrow(
      EnvConfigError,
    );
  });
});

describe("resolveAdminConfig", () => {
  it("uses no credentials against the emulators", () => {
    expect(resolveAdminConfig(emulatorEnv, noFile)).toEqual({ mode: "emulator", projectId: "demo-fma" });
  });

  it("fails fast in production mode without credentials", () => {
    expect(() => resolveAdminConfig(prodEnv, noFile)).toThrow(/no Admin credentials/);
  });

  it("reads the credentials file", () => {
    const cfg = resolveAdminConfig({ ...prodEnv, FIREBASE_ADMIN_CREDENTIALS_PATH: "/k.json" }, () => serviceAccount);
    expect(cfg.mode).toBe("production");
    expect(cfg.projectId).toBe("real-project");
  });

  it("reads base64 credentials", () => {
    const b64 = Buffer.from(serviceAccount).toString("base64");
    expect(resolveAdminConfig({ ...prodEnv, FIREBASE_ADMIN_CREDENTIALS_BASE64: b64 }, noFile).mode).toBe(
      "production",
    );
  });

  it("reports an unreadable path without leaking contents", () => {
    expect(() => resolveAdminConfig({ ...prodEnv, FIREBASE_ADMIN_CREDENTIALS_PATH: "/nope" }, noFile)).toThrow(
      /cannot read/,
    );
    expect(() =>
      resolveAdminConfig({ ...prodEnv, FIREBASE_ADMIN_CREDENTIALS_PATH: "/k" }, () => "SECRET{"),
    ).toThrow(/^(?![\s\S]*SECRET)/);
  });

  it("rejects a key from a different project", () => {
    expect(() =>
      resolveAdminConfig(
        { ...prodEnv, NEXT_PUBLIC_FIREBASE_PROJECT_ID: "other", FIREBASE_ADMIN_CREDENTIALS_PATH: "/k" },
        () => serviceAccount,
      ),
    ).toThrow(/belongs to/);
  });
});
