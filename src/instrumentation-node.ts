import { readFileSync } from "node:fs";
import { resolveAdminConfig } from "@/lib/firebase/admin-config";
import { checkServerEnv } from "@/lib/firebase/env";

try {
  checkServerEnv(process.env);
  resolveAdminConfig(process.env, (p) => readFileSync(p, "utf8"));
} catch (err) {
  // Exit instead of serving every request with a broken (or unsafe) backend.
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
