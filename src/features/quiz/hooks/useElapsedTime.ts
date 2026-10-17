import { useEffect, useState } from "react";
import { elapsedSeconds } from "../domain/selectors";

const TICK_MS = 250;

/**
 * Whole seconds since `startedAt`, always computed from the clock (never by
 * counting ticks), so timer drift and throttled background tabs can't skew it.
 * The interval only triggers re-renders; state bails out when the second is unchanged.
 */
export function useElapsedTime(startedAt: number | null, now: () => number = Date.now): number {
  const [reading, setReading] = useState<{ startedAt: number; seconds: number } | null>(null);

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => {
      const seconds = elapsedSeconds(startedAt, now());
      setReading((prev) =>
        prev && prev.startedAt === startedAt && prev.seconds === seconds ? prev : { startedAt, seconds },
      );
    }, TICK_MS);
    return () => clearInterval(id);
  }, [startedAt, now]);

  return startedAt !== null && reading?.startedAt === startedAt ? reading.seconds : 0;
}
