import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import type { AdminConfig } from "../../src/lib/firebase/admin-config";

export class ScriptGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScriptGuardError";
  }
}

/** Real projects need an explicit --production; emulator runs must not pass it. */
export function assertTarget(config: AdminConfig, production: boolean): void {
  if (config.mode === "production" && !production) {
    throw new ScriptGuardError(
      `refusing to write to the REAL project "${config.projectId}" without --production (emulator hosts are not set)`,
    );
  }
  if (config.mode === "emulator" && production) {
    throw new ScriptGuardError("--production given but the emulator hosts are set; unset them to target the real project");
  }
}

/** Resolves symlinks of the deepest existing ancestor, so a not-yet-created file can be checked. */
function realpathLoose(p: string): string {
  let current = path.resolve(p);
  const rest: string[] = [];
  while (!existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    rest.unshift(path.basename(current));
    current = parent;
  }
  return path.join(realpathSync(current), ...rest);
}

/** Credentials must never land in the working tree (or a symlink into it). */
export function assertOutsideRepo(outPath: string, repoRoot: string): string {
  const resolved = realpathLoose(outPath);
  const root = realpathLoose(repoRoot);
  const rel = path.relative(root, resolved);
  if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
    throw new ScriptGuardError(`--out must be outside the repository (${root}); got ${resolved}`);
  }
  return resolved;
}
