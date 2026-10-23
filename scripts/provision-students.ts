import { closeSync, existsSync, openSync, readFileSync, writeSync } from "node:fs";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { parseStudentId, studentEmail } from "../src/lib/auth/student-id";
import { connectAdmin, isAuthError } from "./lib/admin";
import { parseArgs } from "./lib/args";
import { assertOutsideRepo } from "./lib/guards";
import { generatePassword } from "./lib/password";
import { validateRoster, type RosterRow } from "./lib/roster";

const USAGE = `Usage:
  npm run provision -- <roster.csv> --out <file outside repo> [--production]
  npm run provision -- --reset <studentId> --out <file outside repo> [--production]`;

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

/**
 * Credentials file: owner-only, never overwritten, and created on the first
 * write so a run that creates nobody leaves no file behind.
 */
function credentialsFile(outPath: string): { write: (cols: string[]) => void; close: () => boolean } {
  let fd: number | undefined;
  const csvField = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const line = (cols: string[]) => writeSync(fd!, cols.map(csvField).join(",") + "\n");
  return {
    write: (cols) => {
      if (fd === undefined) {
        fd = openSync(outPath, "wx", 0o600);
        line(["studentId", "name", "roll", "batchId", "password"]);
      }
      line(cols);
    },
    close: () => {
      if (fd !== undefined) closeSync(fd);
      return fd !== undefined;
    },
  };
}

async function provision(csvPath: string, outPath: string, production: boolean): Promise<number> {
  const roster = validateRoster(readFileSync(csvPath, "utf8"));
  if (!roster.ok) {
    console.error(`Roster has ${roster.errors.length} problem(s); nothing was provisioned:`);
    for (const e of roster.errors) console.error(`  ${e}`);
    return 1;
  }

  const admin = connectAdmin(production);
  const out = credentialsFile(outPath);
  let wroteFile = false;
  const created: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  try {
    for (const row of roster.rows) {
      const email = studentEmail(row.studentId, admin.studentEmailDomain);
      try {
        await admin.auth.getUserByEmail(email);
        skipped.push(row.studentId);
        continue;
      } catch (err) {
        if (!isAuthError(err, "auth/user-not-found")) throw err;
      }

      try {
        await createStudent(admin, row, email, out.write);
        created.push(row.studentId);
      } catch (err) {
        failed.push(`${row.studentId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } finally {
    wroteFile = out.close();
    await admin.close();
  }

  // IDs only: passwords never go to the console in bulk mode.
  console.log(`Created ${created.length}: ${created.join(", ") || "-"}`);
  console.log(`Skipped (already exist) ${skipped.length}: ${skipped.join(", ") || "-"}`);
  if (failed.length > 0) {
    console.error(`Failed ${failed.length} (rolled back; rerun to retry):`);
    for (const f of failed) console.error(`  ${f}`);
  }
  if (wroteFile) {
    console.log(`\nCredentials written to ${outPath}`);
    console.log("REMINDER: delete this file as soon as the passwords have been handed out.");
  } else console.log("\nNo new accounts, so no credentials file was written.");
  return failed.length > 0 ? 1 : 0;
}

/** Auth user + claims + roster doc; the Auth user is deleted again if a later step fails. */
async function createStudent(
  admin: ReturnType<typeof connectAdmin>,
  row: RosterRow,
  email: string,
  write: (cols: string[]) => void,
): Promise<void> {
  const password = generatePassword();
  const user = await admin.auth.createUser({ email, password, displayName: row.name });
  try {
    await admin.auth.setCustomUserClaims(user.uid, { role: "student", batchId: row.batchId });
    await admin.db.collection("users").doc(user.uid).create({
      studentId: row.studentId,
      name: row.name,
      roll: row.roll,
      batchId: row.batchId,
      createdAt: FieldValue.serverTimestamp(),
      mustChangePassword: true,
    });
    write([row.studentId, row.name, row.roll, row.batchId, password]);
  } catch (err) {
    await admin.auth.deleteUser(user.uid).catch(() => undefined);
    await admin.db.collection("users").doc(user.uid).delete().catch(() => undefined);
    throw err;
  }
}

async function reset(rawId: string, outPath: string, production: boolean): Promise<number> {
  const id = parseStudentId(rawId);
  if (!id) {
    console.error(`Invalid student ID "${rawId}"`);
    return 1;
  }
  const admin = connectAdmin(production);
  try {
    let user;
    try {
      user = await admin.auth.getUserByEmail(studentEmail(id, admin.studentEmailDomain));
    } catch (err) {
      if (!isAuthError(err, "auth/user-not-found")) throw err;
      console.error(`No student with ID "${id}"`);
      return 1;
    }
    if (user.customClaims?.role !== "student") {
      console.error(`"${id}" is not a student account; refusing to reset`);
      return 1;
    }
    const docRef = admin.db.collection("users").doc(user.uid);
    const profile = (await docRef.get()).data();
    if (!profile) {
      console.error(`"${id}" has no users/${user.uid} roster doc; refusing to reset`);
      return 1;
    }

    const password = generatePassword();
    const out = credentialsFile(outPath);
    try {
      await admin.auth.updateUser(user.uid, { password });
      await docRef.update({ mustChangePassword: true, passwordResetAt: FieldValue.serverTimestamp() });
      await admin.auth.revokeRefreshTokens(user.uid);
      out.write([id, String(profile.name ?? ""), String(profile.roll ?? ""), String(profile.batchId ?? ""), password]);
    } finally {
      out.close();
    }
    console.log(`Reset password for ${id}; existing sessions revoked; must change password at next login.`);
    console.log(`Credentials written to ${outPath}`);
    console.log("REMINDER: delete this file as soon as the password has been handed over.");
    return 0;
  } finally {
    await admin.close();
  }
}

async function main(): Promise<number> {
  const { flags, positionals } = parseArgs(process.argv.slice(2), {
    values: ["out", "reset"],
    booleans: ["production"],
  });
  const out = flags.get("out");
  const resetId = flags.get("reset");
  if (typeof out !== "string" || (resetId === undefined) === (positionals.length !== 1)) {
    console.error(USAGE);
    return 2;
  }
  const outPath = assertOutsideRepo(out, REPO_ROOT);
  // Fail before touching Firebase; the exclusive open still guards the race.
  if (existsSync(outPath)) throw Object.assign(new Error("exists"), { code: "EEXIST" });
  const production = flags.has("production");
  return typeof resetId === "string"
    ? reset(resetId, outPath, production)
    : provision(path.resolve(positionals[0]!), outPath, production);
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    const e = err as { code?: string; message?: string };
    console.error(e.code === "EEXIST" ? "--out file already exists; refusing to overwrite it" : (e.message ?? err));
    process.exitCode = 1;
  },
);
