import { describe, expect, it } from "vitest";
import { MESSAGES, messageForError } from "./messages";
import { checkNewPassword } from "./password";

const err = (code: string) => ({ code });

describe("messageForError", () => {
  it.each([
    "auth/invalid-credential",
    "auth/invalid-login-credentials",
    "auth/wrong-password",
    "auth/user-not-found",
    "auth/user-disabled",
    "auth/invalid-email",
  ])("never reveals whether the ID exists (%s)", (code) => {
    expect(messageForError(err(code))).toBe(MESSAGES.invalidCredentials);
  });

  it("explains credential-already-in-use without merging", () => {
    expect(messageForError(err("auth/credential-already-in-use"))).toBe(MESSAGES.credentialInUse);
  });

  it("falls back to a generic message", () => {
    expect(messageForError(err("auth/something-new"))).toBe(MESSAGES.generic);
    expect(messageForError(new Error("boom"))).toBe(MESSAGES.generic);
    expect(messageForError(null)).toBe(MESSAGES.generic);
  });
});

describe("checkNewPassword", () => {
  it("requires at least 8 characters", () => {
    expect(checkNewPassword("1234567", "1234567")).toEqual({ ok: false, code: "password-too-short" });
    expect(checkNewPassword("12345678", "12345678")).toEqual({ ok: true });
  });

  it("caps the length", () => {
    const long = "a".repeat(129);
    expect(checkNewPassword(long, long)).toEqual({ ok: false, code: "password-too-long" });
  });

  it("requires the confirmation to match", () => {
    expect(checkNewPassword("abcdefgh", "abcdefgH")).toEqual({ ok: false, code: "password-mismatch" });
    expect(messageForError({ code: "password-mismatch" })).toBe(MESSAGES.passwordMismatch);
  });
});
