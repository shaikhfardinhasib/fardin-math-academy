import "server-only";
import { createAdminServices, type AdminServices } from "./admin-core";

// Node runtime only: firebase-admin needs Node APIs (and is externalised by Next).
let services: AdminServices | undefined;

/** Lazily initialised so a missing credential fails on first use with a clear EnvConfigError. */
function admin(): AdminServices {
  services ??= createAdminServices();
  return services;
}

export const adminAuth = () => admin().auth;
export const adminDb = () => admin().db;
