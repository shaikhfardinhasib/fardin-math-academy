/** Session cookie shared by the Route Handlers, getCurrentUser and proxy. */

// `__session` is the one cookie name Firebase Hosting forwards to the backend.
export const SESSION_COOKIE = "__session";

/** Firebase allows 5 minutes to 14 days. */
export const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60;

/** createSessionCookie should only accept a token from a sign-in that just happened. */
export const RECENT_SIGN_IN_SECONDS = 5 * 60;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
