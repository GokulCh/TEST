/**
 * Next.js Edge Middleware.
 *
 * 1. Guild subdomain → portal rewrite: a request to prbw.myrbw.dev (or any
 *    {guild}.{root} host — including {guild}.localhost in dev) is internally
 *    rewritten to /public/{guildId} so the existing public portal pages render
 *    under the guild's own subdomain. The explicit /public/[guildId] path
 *    remains available for previews and local testing (apex hosts like
 *    `localhost` or `myrbw.dev` never match a subdomain rule).
 * 2. Protects /dashboard/* routes — redirects to /setup when no session cookie
 *    is present. Runs on the Edge runtime so it only inspects the cookie name;
 *    it does NOT verify the HMAC signature (that happens server-side).
 */

import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_PORTAL_ROOT_DOMAIN } from "@/lib/config-public-url";

const COOKIE_NAME = "rbw_session";

// Subdomain → guild route id. Mirrors the demo mapping in guildDomain().
const GUILD_SUBDOMAIN_ALIASES: Record<string, string> = {
  prbw: "demo",
};

// Root domains a guild subdomain may sit on. `localhost` is always allowed so
// `{guild}.localhost` works for local previews (browsers resolve it to loopback).
const ROOT_DOMAINS = (() => {
  const configured = PUBLIC_PORTAL_ROOT_DOMAIN.replace(/^\.+/, "").toLowerCase();
  return configured === "localhost" ? [configured] : [configured, "localhost"];
})();

/**
 * Returns the guild subdomain for a host (e.g. `prbw` for `prbw.myrbw.dev`),
 * or null when the host is an apex / not a guild host at all.
 */
function parseGuildHost(host: string): string | null {
  for (const root of ROOT_DOMAINS) {
    if (host === root) return null;
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, -root.length - 1);
      if (sub && sub !== "www") return sub;
      return null;
    }
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const sub = parseGuildHost(host);

  if (
    sub &&
    !pathname.startsWith("/public/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/api/")
  ) {
    const guildId = GUILD_SUBDOMAIN_ALIASES[sub] ?? sub;
    const url = req.nextUrl.clone();
    url.pathname =
      pathname === "/"
        ? `/public/${guildId}`
        : `/public/${guildId}${pathname}`;
    return NextResponse.rewrite(url);
  }

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
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};