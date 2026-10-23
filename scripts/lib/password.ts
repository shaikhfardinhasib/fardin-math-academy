import { randomInt } from "node:crypto";

/** No 0 O 1 l I: students copy these by hand from a printed slip. */
export const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export const PASSWORD_LENGTH = 10;

/** Uniform over the alphabet via crypto.randomInt (CSPRNG, no modulo bias). */
export function generatePassword(length = PASSWORD_LENGTH, rand: (max: number) => number = randomInt): string {
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHABET[rand(PASSWORD_ALPHABET.length)];
  return out;
}
