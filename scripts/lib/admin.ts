import { checkServerEnv } from "../../src/lib/firebase/env";
import { createAdminServices, type AdminServices } from "../../src/lib/firebase/admin-core";
import { assertTarget } from "./guards";

/** Admin SDK for the CLI scripts, after the same env checks the server runs at startup. */
export function connectAdmin(production: boolean): AdminServices & { studentEmailDomain: string } {
  const { studentEmailDomain } = checkServerEnv(process.env);
  const services = createAdminServices(process.env, "fma-script");
  assertTarget(services.config, production);
  console.log(
    services.config.mode === "emulator"
      ? `Target: EMULATOR (${services.config.projectId})`
      : `Target: REAL PROJECT ${services.config.projectId}`,
  );
  return { ...services, studentEmailDomain };
}

export function isAuthError(err: unknown, code: string): boolean {
  return (err as { code?: unknown } | null)?.code === code;
}
