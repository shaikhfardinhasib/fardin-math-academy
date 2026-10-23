import { z } from "zod";

/**
 * Student IDs are teacher-issued handles like "b26a-101". Firebase only knows
 * email/password, so each ID maps to a synthetic, never-mailed address
 * `<id>@<NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN>`. Shared by the login form, the
 * server and the provisioning scripts so all three agree on the mapping.
 */

export const STUDENT_ID_MIN_LENGTH = 3;
export const STUDENT_ID_MAX_LENGTH = 32;

const BENGALI_DIGITS = /[০-৯]/g;

/** Trim, lowercase, and map Bengali digits (a Bangla keyboard types ১০১) to ASCII. */
export function normalizeStudentId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(BENGALI_DIGITS, (d) => String(d.charCodeAt(0) - 0x09e6));
}

/** Lowercase alphanumeric groups joined by single hyphens; safe as an email local part. */
export const StudentIdSchema = z
  .string()
  .transform(normalizeStudentId)
  .pipe(
    z
      .string()
      .min(STUDENT_ID_MIN_LENGTH)
      .max(STUDENT_ID_MAX_LENGTH)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  );

export type StudentId = z.output<typeof StudentIdSchema>;

export function parseStudentId(raw: string): StudentId | null {
  const result = StudentIdSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function studentEmail(id: StudentId, domain: string): string {
  return `${id}@${domain}`;
}

/** Inverse of studentEmail; null for any address outside the student domain. */
export function studentIdFromEmail(email: string, domain: string): StudentId | null {
  const suffix = `@${domain}`;
  if (!email.endsWith(suffix)) return null;
  const id = email.slice(0, -suffix.length);
  return StudentIdSchema.safeParse(id).success && id === normalizeStudentId(id) ? id : null;
}
