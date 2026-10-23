import { defineConfig } from "vitest/config";

/** Security-rules tests; need the Firestore emulator (see `npm run test:rules`). */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    // One shared emulator database: run files serially.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
