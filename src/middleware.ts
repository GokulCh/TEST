/**
 * Next.js Edge Middleware
 * Protects /dashboard/* routes — redirects to /setup when no session cookie present.
 * Runs on the Edge runtime so it only inspects the cookie name; it does NOT
 * verify the HMAC signature (that happens in server-side route handlers).
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "rbw_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard the dashboard subtree
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const session = req.cookies.get(COOKIE_NAME);

  if (!session?.value) {
    const setupUrl = new URL("/setup", req.url);
    setupUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(setupUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
