import { describe, expect, it } from "vitest";
import { mulberry32 } from "./seeded";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("returns a permutation and does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const frozen = Object.freeze([...input]);
    const out = shuffle(frozen, mulberry32(1));
    expect([...out].sort((a, b) => a - b)).toEqual(input);
    expect(out).not.toBe(frozen);
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([7])).toEqual([7]);
  });

  it("is deterministic for a given seed", () => {
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(42))).toEqual(shuffle([1, 2, 3, 4, 5], mulberry32(42)));
  });

  it("is uniform: each of the 24 permutations of 4 items appears ~equally", () => {
    const rng = mulberry32(2024);
    const counts = new Map<string, number>();
    const trials = 48_000;
    for (let i = 0; i < trials; i++) {
      const key = shuffle([0, 1, 2, 3], rng).join("");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(24);
    const expected = trials / 24;
    for (const c of counts.values()) {
      expect(Math.abs(c - expected)).toBeLessThan(expected * 0.15);
    }
  });

  it("an element lands in each position about equally often", () => {
    const rng = mulberry32(7);
    const positions = [0, 0, 0, 0];
    const trials = 20_000;
    for (let i = 0; i < trials; i++) {
      const at = shuffle([0, 1, 2, 3], rng).indexOf(0);
      positions[at] = (positions[at] ?? 0) + 1;
    }
    for (const c of positions) expect(Math.abs(c - trials / 4)).toBeLessThan(trials * 0.02);
  });
});
