import { readFileSync } from "node:fs";
import path from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

/** Runs against the Firestore emulator: `npm run test:rules`. */

let env: RulesTestEnvironment;

const ALICE = "alice-uid";
const BOB = "bob-uid";
const student = (batchId = "b26a") => ({ role: "student", batchId });

const profile = (studentId: string) => ({
  studentId,
  name: studentId,
  roll: "1",
  batchId: "b26a",
  createdAt: new Date(0),
  mustChangePassword: false,
});

beforeAll(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host) throw new Error("FIRESTORE_EMULATOR_HOST is not set; run via `npm run test:rules`");
  const [hostname, port] = host.split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-fma",
    firestore: {
      host: hostname,
      port: Number(port),
      rules: readFileSync(path.resolve(import.meta.dirname, "../../firestore.rules"), "utf8"),
    },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc(`users/${ALICE}`).set(profile("b26a-101"));
    await db.doc(`users/${BOB}`).set(profile("b26a-102"));
    await db.doc("other/thing").set({ x: 1 });
  });
});

afterAll(async () => {
  await env?.cleanup();
});

const alice = () => env.authenticatedContext(ALICE, student()).firestore();
const teacher = () => env.authenticatedContext("teacher-uid", { role: "teacher" }).firestore();

describe("users/{uid} reads", () => {
  it("a student reads their own doc", async () => {
    await assertSucceeds(alice().doc(`users/${ALICE}`).get());
  });

  it("a student cannot read another student's doc", async () => {
    await assertFails(alice().doc(`users/${BOB}`).get());
  });

  it("a student cannot list the roster", async () => {
    await assertFails(alice().collection("users").get());
  });

  it("a teacher reads any student doc and can list the roster", async () => {
    await assertSucceeds(teacher().doc(`users/${ALICE}`).get());
    await assertSucceeds(teacher().doc(`users/${BOB}`).get());
    await assertSucceeds(teacher().collection("users").get());
  });

  it("an unenrolled user (no role claim) is denied, even for their own uid", async () => {
    const db = env.authenticatedContext(ALICE).firestore();
    await assertFails(db.doc(`users/${ALICE}`).get());
    await assertFails(db.collection("users").get());
  });

  it("an unknown role claim is denied", async () => {
    await assertFails(env.authenticatedContext(ALICE, { role: "admin" }).firestore().doc(`users/${ALICE}`).get());
  });

  it("an unauthenticated visitor is denied", async () => {
    await assertFails(env.unauthenticatedContext().firestore().doc(`users/${ALICE}`).get());
  });
});

describe("client writes are always denied", () => {
  const contexts = {
    "own student": () => alice(),
    "other student": () => env.authenticatedContext(BOB, student()).firestore(),
    teacher: () => teacher(),
    unenrolled: () => env.authenticatedContext("nobody").firestore(),
    unauthenticated: () => env.unauthenticatedContext().firestore(),
  };

  for (const [who, db] of Object.entries(contexts)) {
    it(`${who}: create, update, set, delete on users/* fail`, async () => {
      await assertFails(db().doc(`users/${ALICE}`).update({ mustChangePassword: false }));
      await assertFails(db().doc(`users/${ALICE}`).set({ ...profile("b26a-101"), role: "teacher" }));
      await assertFails(db().doc(`users/${ALICE}`).delete());
      await assertFails(db().doc("users/new-uid").set(profile("b26a-999")));
      await assertFails(db().collection("users").add(profile("b26a-998")));
    });
  }

  it("a student cannot even write a doc for their own new uid", async () => {
    const db = env.authenticatedContext("fresh-uid", student()).firestore();
    await assertFails(db.doc("users/fresh-uid").set(profile("b26a-500")));
  });
});

describe("default deny", () => {
  it("every other path is closed to everyone", async () => {
    for (const db of [alice(), teacher(), env.unauthenticatedContext().firestore()]) {
      await assertFails(db.doc("other/thing").get());
      await assertFails(db.doc("other/thing").set({ x: 2 }));
      await assertFails(db.doc("attempts/a1").set({ score: 10 }));
      await assertFails(db.doc(`users/${ALICE}/private/x`).get());
    }
  });
});
