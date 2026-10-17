import type { Student } from "./types";

export const NAME_MAX_LENGTH = 60;
export const ROLL_MAX_LENGTH = 20;

export type RegistrationResult =
  | { ok: true; student: Student }
  | { ok: false; missing: { name: boolean; roll: boolean } };

/** Trims both inputs, requires them non-empty, and clamps to the max lengths. */
export function validateRegistration(input: { name: string; roll: string }): RegistrationResult {
  const name = input.name.trim().slice(0, NAME_MAX_LENGTH).trim();
  const roll = input.roll.trim().slice(0, ROLL_MAX_LENGTH).trim();
  if (!name || !roll) return { ok: false, missing: { name: !name, roll: !roll } };
  return { ok: true, student: { name, roll } };
}
