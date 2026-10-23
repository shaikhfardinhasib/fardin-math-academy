import { z } from "zod";
import { StudentIdSchema } from "../../src/lib/auth/student-id";

/** Roster CSV: header `studentId,name,roll,batchId`, one student per line. */

export const ROSTER_COLUMNS = ["studentId", "name", "roll", "batchId"] as const;

export const RosterRowSchema = z.object({
  studentId: StudentIdSchema,
  name: z.string().trim().min(1).max(60),
  roll: z.string().trim().min(1).max(20),
  batchId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(32),
});

export type RosterRow = z.output<typeof RosterRowSchema>;

export type RosterResult = { ok: true; rows: RosterRow[] } | { ok: false; errors: string[] };

/** Minimal RFC 4180 parser: quoted fields may contain commas, quotes ("") and newlines. */
export function parseCsv(text: string): { line: number; fields: string[] }[] {
  const records: { line: number; fields: string[] }[] = [];
  let fields: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let recordLine = 1;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else {
        if (c === "\n") line++;
        field += c;
      }
    } else if (c === '"' && field === "") quoted = true;
    else if (c === ",") {
      fields.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      fields.push(field);
      records.push({ line: recordLine, fields });
      fields = [];
      field = "";
      line++;
      recordLine = line;
    } else field += c;
  }
  if (field !== "" || fields.length > 0) {
    fields.push(field);
    records.push({ line: recordLine, fields });
  }
  // Blank lines are not records.
  return records.filter((r) => !(r.fields.length === 1 && r.fields[0]!.trim() === ""));
}

/** Validates every row and reports ALL problems; never returns a partial roster. */
export function validateRoster(text: string): RosterResult {
  const records = parseCsv(text);
  const errors: string[] = [];
  const header = records.shift();
  if (!header || header.fields.map((f) => f.trim()).join(",") !== ROSTER_COLUMNS.join(",")) {
    return { ok: false, errors: [`line 1: header must be exactly "${ROSTER_COLUMNS.join(",")}"`] };
  }
  if (records.length === 0) return { ok: false, errors: ["no student rows"] };

  const rows: RosterRow[] = [];
  const seen = new Map<string, number>();
  for (const { line, fields } of records) {
    if (fields.length !== ROSTER_COLUMNS.length) {
      errors.push(`line ${line}: expected ${ROSTER_COLUMNS.length} columns, got ${fields.length}`);
      continue;
    }
    const raw = Object.fromEntries(ROSTER_COLUMNS.map((col, i) => [col, fields[i]]));
    const parsed = RosterRowSchema.safeParse(raw);
    if (!parsed.success) {
      const cols = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
      errors.push(`line ${line}: invalid ${cols.join(", ")}`);
      continue;
    }
    const first = seen.get(parsed.data.studentId);
    if (first !== undefined) {
      errors.push(`line ${line}: duplicate studentId "${parsed.data.studentId}" (first on line ${first})`);
      continue;
    }
    seen.set(parsed.data.studentId, line);
    rows.push(parsed.data);
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, rows };
}
