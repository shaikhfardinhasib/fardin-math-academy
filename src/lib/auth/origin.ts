/**
 * CSRF guard for the /api/auth/* Route Handlers. Stricter than Next's own
 * Server Action check: a missing Origin is rejected, not just warned about.
 */

export function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function isAllowedOrigin(headers: Headers, allowedOrigins: string[]): boolean {
  const origin = headers.get("origin");
  if (!origin || origin === "null") return false;

  // Browsers that send Fetch Metadata tell us directly.
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;

  if (allowedOrigins.length > 0) return allowedOrigins.includes(origin);

  // A proxy chain may append hosts; the first is what the browser used.
  const host = (headers.get("x-forwarded-host") ?? headers.get("host"))?.split(",")[0]?.trim();
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
