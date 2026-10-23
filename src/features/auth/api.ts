/** Client-side calls to the /api/auth/* Route Handlers. */

export class ApiError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ApiError";
  }
}

export async function postJson<T = Record<string, unknown>>(path: string, body: unknown = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("auth/network-request-failed");
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string } & T;
  if (!res.ok || data.ok === false) throw new ApiError(data.code ?? "generic");
  return data;
}
