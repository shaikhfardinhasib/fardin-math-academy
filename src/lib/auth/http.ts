import "server-only";
import type { z } from "zod";
import { isAllowedOrigin, parseAllowedOrigins } from "./origin";

/** JSON error with a machine-readable code; the client maps codes to Bangla text. */
export function jsonError(status: number, code: string): Response {
  return Response.json({ ok: false, code }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * CSRF guard for state-changing auth endpoints: same-origin only, and JSON
 * only (a cross-site <form> cannot send application/json without a preflight).
 */
export function rejectUntrustedRequest(request: Request): Response | null {
  if (!isAllowedOrigin(request.headers, parseAllowedOrigins(process.env.APP_ORIGINS))) {
    return jsonError(403, "bad-origin");
  }
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return jsonError(415, "bad-content-type");
  return null;
}

export async function readJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T> | null> {
  try {
    const parsed = schema.safeParse(await request.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
