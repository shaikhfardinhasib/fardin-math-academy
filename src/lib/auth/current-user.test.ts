import { describe, expect, it, vi } from "vitest";
import { resolveCurrentUser, type CurrentUserDeps, type VerifiedToken } from "./current-user";

const profile = {
  studentId: "b26a-101",
  name: "তাহমিদ",
  roll: "101",
  batchId: "b26a",
  mustChangePassword: false,
  createdAt: new Date(0),
};

function authError(code: string) {
  return Object.assign(new Error(code), { code });
}

function deps(token: Partial<VerifiedToken> | Error, doc: unknown = profile): CurrentUserDeps {
  return {
    verifySession: vi.fn(async () => {
      if (token instanceof Error) throw token;
      return { uid: "u1", auth_time: 0, ...token };
    }),
    loadStudentProfile: vi.fn(async () => doc),
  };
}

describe("resolveCurrentUser", () => {
  it("is unauthenticated without a cookie and never calls Firebase", async () => {
    const d = deps({});
    expect(await resolveCurrentUser(undefined, d)).toEqual({ status: "unauthenticated" });
    expect(d.verifySession).not.toHaveBeenCalled();
  });

  it.each(["auth/session-cookie-revoked", "auth/session-cookie-expired", "auth/argument-error", "auth/user-disabled"])(
    "is unauthenticated on %s",
    async (code) => {
      expect(await resolveCurrentUser("c", deps(authError(code)))).toEqual({ status: "unauthenticated" });
    },
  );

  it("rethrows non-auth failures instead of guessing", async () => {
    await expect(resolveCurrentUser("c", deps(new Error("ECONNREFUSED")))).rejects.toThrow("ECONNREFUSED");
  });

  it("is unenrolled without a role claim, and does not read Firestore", async () => {
    const d = deps({ email: "x@gmail.com" });
    expect(await resolveCurrentUser("c", d)).toEqual({ status: "unenrolled", uid: "u1", email: "x@gmail.com" });
    expect(d.loadStudentProfile).not.toHaveBeenCalled();
  });

  it.each([{ role: "admin" }, { role: "student" }, { role: "student", batchId: "" }, { role: ["teacher"] }])(
    "is unenrolled with malformed claims %j",
    async (claims) => {
      expect((await resolveCurrentUser("c", deps(claims))).status).toBe("unenrolled");
    },
  );

  it("maps a teacher claim", async () => {
    const d = deps({ role: "teacher", email: "t@example.com", name: "Fardin" });
    expect(await resolveCurrentUser("c", d)).toEqual({
      status: "teacher",
      uid: "u1",
      email: "t@example.com",
      name: "Fardin",
      mustChangePassword: false,
      authTime: 0,
    });
    expect(d.loadStudentProfile).not.toHaveBeenCalled();
  });

  it("maps a student claim plus roster profile, with the claim's batchId winning", async () => {
    const user = await resolveCurrentUser("c", deps({ role: "student", batchId: "b26a" }, { ...profile, batchId: "stale" }));
    expect(user).toEqual({
      status: "student",
      uid: "u1",
      studentId: "b26a-101",
      name: "তাহমিদ",
      roll: "101",
      batchId: "b26a",
      mustChangePassword: false,
      authTime: 0,
    });
  });

  it("carries mustChangePassword from the profile", async () => {
    const user = await resolveCurrentUser(
      "c",
      deps({ role: "student", batchId: "b26a" }, { ...profile, mustChangePassword: true }),
    );
    expect(user.status === "student" && user.mustChangePassword).toBe(true);
  });

  it("treats a student claim with no (or a broken) profile as unenrolled", async () => {
    expect((await resolveCurrentUser("c", deps({ role: "student", batchId: "b26a" }, null))).status).toBe("unenrolled");
    expect(
      (await resolveCurrentUser("c", deps({ role: "student", batchId: "b26a" }, { name: "x" }))).status,
    ).toBe("unenrolled");
  });

  it("ignores a role field in the profile doc", async () => {
    const user = await resolveCurrentUser("c", deps({}, { ...profile, role: "teacher" }));
    expect(user.status).toBe("unenrolled");
  });
});
