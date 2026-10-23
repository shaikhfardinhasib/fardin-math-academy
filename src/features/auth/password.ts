import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Error messages are API codes; the UI maps them via messageForError. */
export const NewPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "password-too-short")
  .max(PASSWORD_MAX_LENGTH, "password-too-long");

export type PasswordCheck = { ok: true } | { ok: false; code: string };

/** Client-side check of the form, mirrored by the server's NewPasswordSchema. */
export function checkNewPassword(password: string, confirm: string): PasswordCheck {
  const parsed = NewPasswordSchema.safeParse(password);
  if (!parsed.success) return { ok: false, code: parsed.error.issues[0]?.message ?? "password-too-short" };
  if (password !== confirm) return { ok: false, code: "password-mismatch" };
  return { ok: true };
}
