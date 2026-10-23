import { mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseArgs } from "./args";
import { assertOutsideRepo, assertTarget } from "./guards";
import { generatePassword, PASSWORD_ALPHABET, PASSWORD_LENGTH } from "./password";
import { parseCsv, validateRoster } from "./roster";

describe("generatePassword", () => {
  it("excludes the ambiguous characters 0 O 1 l I", () => {
    for (const c of "0O1lI") expect(PASSWORD_ALPHABET).not.toContain(c);
    expect(new Set(PASSWORD_ALPHABET).size).toBe(PASSWORD_ALPHABET.length);
  });

  it("is 10 characters drawn only from the alphabet", () => {
    for (let i = 0; i < 1000; i++) {
      const p = generatePassword();
      expect(p).toHaveLength(PASSWORD_LENGTH);
      expect([...p].every((c) => PASSWORD_ALPHABET.includes(c))).toBe(true);
    }
  });

  it("produces no duplicates across 10k", () => {
    const seen = new Set(Array.from({ length: 10_000 }, () => generatePassword()));
    expect(seen.size).toBe(10_000);
  });

  it("uses the injected random source for every character", () => {
    const calls: number[] = [];
    const p = generatePassword(4, (max) => {
      calls.push(max);
      return 0;
    });
    expect(p).toBe("AAAA");
    expect(calls).toEqual(Array(4).fill(PASSWORD_ALPHABET.length));
  });
});

const HEADER = "studentId,name,roll,batchId";

describe("parseCsv", () => {
  it("handles quotes, embedded commas/newlines, CRLF, BOM and blank lines", () => {
    const records = parseCsv('﻿a,b\r\n"x, y","he said ""hi"""\n\n"multi\nline",z\n');
    expect(records).toEqual([
      { line: 1, fields: ["a", "b"] },
      { line: 2, fields: ["x, y", 'he said "hi"'] },
      { line: 4, fields: ["multi\nline", "z"] },
    ]);
  });
});

describe("validateRoster", () => {
  it("normalises and accepts valid rows", () => {
    const result = validateRoster(`${HEADER}\n B26A-101 ,তাহমিদ হাসান,101,B26A\nb26a-102,"Rafi, Jr.",102,b26a\n`);
    expect(result).toEqual({
      ok: true,
      rows: [
        { studentId: "b26a-101", name: "তাহমিদ হাসান", roll: "101", batchId: "b26a" },
        { studentId: "b26a-102", name: "Rafi, Jr.", roll: "102", batchId: "b26a" },
      ],
    });
  });

  it("reports every invalid row, not just the first", () => {
    const result = validateRoster(
      [HEADER, "b26a-101,A,1,b26a", "bad id,B,2,b26a", "b26a-103,,3,b26a", "b26a-104,D,4", "B26A-101,E,5,b26a", "b26a-106,F,6,b 26"].join("\n"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      "line 3: invalid studentId",
      "line 4: invalid name",
      "line 5: expected 4 columns, got 3",
      'line 6: duplicate studentId "b26a-101" (first on line 2)',
      "line 7: invalid batchId",
    ]);
  });

  it("requires the exact header and at least one row", () => {
    expect(validateRoster("id,name,roll,batch\nx,y,z,w")).toMatchObject({ ok: false });
    expect(validateRoster(`${HEADER}\n`)).toEqual({ ok: false, errors: ["no student rows"] });
    expect(validateRoster("")).toMatchObject({ ok: false });
  });
});

describe("assertTarget", () => {
  const emulator = { mode: "emulator", projectId: "demo-fma" } as const;
  const real = { mode: "production", projectId: "p", serviceAccount: { project_id: "p", client_email: "a@b.c", private_key: "k" } } as const;

  it("refuses the real project without --production", () => {
    expect(() => assertTarget(real, false)).toThrow(/--production/);
    expect(() => assertTarget(real, true)).not.toThrow();
  });

  it("refuses --production against the emulators", () => {
    expect(() => assertTarget(emulator, true)).toThrow();
    expect(() => assertTarget(emulator, false)).not.toThrow();
  });
});

describe("assertOutsideRepo", () => {
  const repo = mkdtempSync(path.join(tmpdir(), "fma-repo-"));
  const outside = mkdtempSync(path.join(tmpdir(), "fma-out-"));

  it("accepts a path outside the repo", () => {
    expect(assertOutsideRepo(path.join(outside, "creds.csv"), repo)).toBe(path.join(outside, "creds.csv"));
  });

  it("refuses paths inside the repo, including relative and not-yet-existing dirs", () => {
    expect(() => assertOutsideRepo(path.join(repo, "creds.csv"), repo)).toThrow(/outside/);
    expect(() => assertOutsideRepo(path.join(repo, "new/dir/creds.csv"), repo)).toThrow(/outside/);
    expect(() => assertOutsideRepo(repo, repo)).toThrow(/outside/);
    expect(() => assertOutsideRepo(path.join(outside, "../", path.basename(repo), "x.csv"), repo)).toThrow(/outside/);
  });

  it("sees through a symlink pointing into the repo", () => {
    const link = path.join(outside, "sneaky");
    symlinkSync(repo, link);
    expect(() => assertOutsideRepo(path.join(link, "creds.csv"), repo)).toThrow(/outside/);
  });

  it("does not confuse a sibling with a shared prefix", () => {
    expect(() => assertOutsideRepo(`${repo}-sibling/creds.csv`, repo)).not.toThrow();
  });
});

describe("parseArgs", () => {
  it("parses values, booleans and positionals; rejects unknown flags", () => {
    const { flags, positionals } = parseArgs(["r.csv", "--out", "/tmp/x", "--production"], {
      values: ["out"],
      booleans: ["production"],
    });
    expect(positionals).toEqual(["r.csv"]);
    expect(flags.get("out")).toBe("/tmp/x");
    expect(flags.get("production")).toBe(true);
    expect(() => parseArgs(["--prodution"], { values: [], booleans: ["production"] })).toThrow(/unknown/);
    expect(() => parseArgs(["--out"], { values: ["out"], booleans: [] })).toThrow(/value/);
  });
});
