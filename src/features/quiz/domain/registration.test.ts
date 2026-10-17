import { describe, expect, it } from "vitest";
import { NAME_MAX_LENGTH, validateRegistration } from "./registration";

describe("validateRegistration", () => {
  it("trims inputs", () => {
    expect(validateRegistration({ name: "  তাহমিদ  ", roll: " 101 " })).toEqual({
      ok: true,
      student: { name: "তাহমিদ", roll: "101" },
    });
  });

  it("flags which fields are missing, treating whitespace as empty", () => {
    expect(validateRegistration({ name: "   ", roll: "1" })).toEqual({ ok: false, missing: { name: true, roll: false } });
    expect(validateRegistration({ name: "a", roll: "" })).toEqual({ ok: false, missing: { name: false, roll: true } });
  });

  it("clamps overlong names", () => {
    const r = validateRegistration({ name: "x".repeat(NAME_MAX_LENGTH + 40), roll: "1" });
    expect(r.ok && r.student.name.length).toBe(NAME_MAX_LENGTH);
  });
});
