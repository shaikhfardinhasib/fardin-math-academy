import { describe, expect, it } from "vitest";
import { normalizeStudentId, parseStudentId, studentEmail, studentIdFromEmail } from "./student-id";

const DOMAIN = "students.example.invalid";

describe("normalizeStudentId", () => {
  it("trims and lowercases", () => {
    expect(normalizeStudentId("  B26A-101 \n")).toBe("b26a-101");
  });

  it("maps Bengali digits to ASCII", () => {
    expect(normalizeStudentId("b২৬a-১০১")).toBe("b26a-101");
  });
});

describe("parseStudentId", () => {
  it.each(["b26a-101", "B26A-101", " b26a-101 ", "abc", "a1-b2-c3"])("accepts %j", (raw) => {
    expect(parseStudentId(raw)).toBe(normalizeStudentId(raw));
  });

  it.each([
    "",
    "ab",
    "a".repeat(33),
    "b26a--101",
    "-b26a",
    "b26a-",
    "b26a 101",
    "b26a_101",
    "b26a@x.com",
    "b26a.101",
    "ছাত্র",
  ])("rejects %j", (raw) => {
    expect(parseStudentId(raw)).toBeNull();
  });
});

describe("synthetic email mapping", () => {
  it("maps an ID to <id>@<domain>", () => {
    expect(studentEmail(parseStudentId("B26A-101")!, DOMAIN)).toBe("b26a-101@students.example.invalid");
  });

  it("round-trips", () => {
    const id = parseStudentId("b26a-101")!;
    expect(studentIdFromEmail(studentEmail(id, DOMAIN), DOMAIN)).toBe(id);
  });

  it("returns null for other domains and non-canonical local parts", () => {
    expect(studentIdFromEmail("b26a-101@gmail.com", DOMAIN)).toBeNull();
    expect(studentIdFromEmail("b26a-101@evil.students.example.invalid.com", DOMAIN)).toBeNull();
    expect(studentIdFromEmail("B26A-101@students.example.invalid", DOMAIN)).toBeNull();
    expect(studentIdFromEmail("a@b@students.example.invalid", DOMAIN)).toBeNull();
  });
});
