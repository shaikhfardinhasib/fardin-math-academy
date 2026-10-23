import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

/**
 * UX only: bounce visitors without a session cookie to /login before
 * rendering. It does NOT verify the cookie; every page and Route Handler
 * authorizes itself via getCurrentUser().
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/", "/change-password", "/account", "/unenrolled"],
};
