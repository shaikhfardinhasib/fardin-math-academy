import { z } from "zod";
import { connectAdmin, isAuthError } from "./lib/admin";
import { parseArgs } from "./lib/args";

const USAGE = "Usage: npm run set-teacher -- <email> [--create] [--production]";

async function main(): Promise<number> {
  const { flags, positionals } = parseArgs(process.argv.slice(2), {
    values: [],
    booleans: ["create", "production"],
  });
  const email = z.string().trim().toLowerCase().email().safeParse(positionals[0]);
  if (positionals.length !== 1 || !email.success) {
    console.error(USAGE);
    return 2;
  }

  const admin = connectAdmin(flags.has("production"));
  try {
    if (email.data.endsWith(`@${admin.studentEmailDomain}`)) {
      console.error("That is a synthetic student address; teachers use their own email.");
      return 1;
    }

    let uid: string;
    try {
      uid = (await admin.auth.getUserByEmail(email.data)).uid;
    } catch (err) {
      if (!isAuthError(err, "auth/user-not-found")) throw err;
      if (!flags.has("create")) {
        console.error(`No user with ${email.data}. Pass --create to pre-create it (then sign in with Google).`);
        return 1;
      }
      // Password-less: the teacher signs in with the Google account of this email.
      uid = (await admin.auth.createUser({ email: email.data })).uid;
      console.log(`Created user ${email.data}`);
    }

    // Replaces all claims (drops any student batchId).
    await admin.auth.setCustomUserClaims(uid, { role: "teacher" });
    // Session cookies carry the old claims; force a fresh sign-in so the role applies now.
    await admin.auth.revokeRefreshTokens(uid);
    console.log(`${email.data} is now a teacher (existing sessions revoked; sign in again).`);
    return 0;
  } finally {
    await admin.close();
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  },
);
