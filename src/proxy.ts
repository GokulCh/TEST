/**
 * Next.js Edge Proxy.
 *
 * 1. Guild subdomain → portal rewrite: a request to any {guild}.{root} host
 *    (including {guild}.localhost in dev) is internally rewritten to /public/{guildId}
 *    so the existing public portal pages render under the guild's own subdomain.
 *    The guild ID is resolved through lib/portal-domains (cached Database API lookup).
 * 2. Protects /dashboard/* routes — redirects to /setup when no session cookie
 *    is present. Runs on the Node.js runtime (Next 16 proxies always do).
 *
 * Note: this only checks that a well-formed session cookie is present.
 * Full HMAC signature validation happens server-side in requireAuth().
 */

import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_PORTAL_ROOT_DOMAIN } from "@/lib/config-public-url";
import { findPortalBySubdomain } from "@/lib/server/portal-domains";

const COOKIE_NAME = "rbw_session";

// Cookie domain for subdomain support (must match session.ts)
const COOKIE_DOMAIN = process.env.NODE_ENV === "production" 
  ? (PUBLIC_PORTAL_ROOT_DOMAIN ? `.${PUBLIC_PORTAL_ROOT_DOMAIN.replace(/^\.+/, "").replace(/^www\./, "")}` : undefined)
  : ".localhost";

// Root domains a guild subdomain may sit on. `localhost` is always allowed so
// `{guild}.localhost` works for local previews (browsers resolve it to loopback).
const ROOT_DOMAINS = (() => {
  const configured = PUBLIC_PORTAL_ROOT_DOMAIN.replace(/^\.+/, "").replace(/^www\./, "").toLowerCase();
  return configured === "localhost" ? [configured] : [configured, "localhost"];
})();

/**
 * Returns the guild subdomain for a host (e.g. `test` for `test.myrbw.dev`),
 * or null when the host is an apex / not a guild host at all.
 */
function parseGuildHost(host: string): string | null {
  for (const root of ROOT_DOMAINS) {
    if (host === root) return null;
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, -root.length - 1);
      // Validate subdomain format to prevent injection
      // Treat www as a valid domain variant, not a guild subdomain
      if (sub && sub !== "www" && /^[a-z0-9-]+$/i.test(sub)) {
        return sub;
      }
      return null;
    }
  }
  return null;
}

/**
 * The route id of the guild that claimed `subdomain` (its Discord snowflake, or
 * "demo" for the built-in preview). Goes through the same cached, breaker-guarded
 * lookup the portal pages use, so a page view is not a Database API call per
 * request. Production never guesses: an unknown subdomain is a 404. In
 * development an unresolved subdomain is used as the id, so `{guild}.localhost` works.
 */
async function resolveGuildId(subdomain: string): Promise<string | null> {
  const portal = await findPortalBySubdomain(subdomain);
  if (portal) return portal.snowflakeId;
  return process.env.NODE_ENV === "production" ? null : subdomain;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const sub = parseGuildHost(host);

  // Only log in development for debugging
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Proxy] Request: ${pathname}, Host: ${host}, Subdomain: ${sub}`);
  }

  // Restrict API routes to api.myrbw.dev or localhost for development
  const isApiRoute = pathname.startsWith("/api/v1");
  const isAllowedDomain = 
    host === "api.myrbw.dev" ||
    host === "localhost" ||
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    // Allow Vercel preview URLs that start with api-
    (host.includes("vercel.app") && host.startsWith("api-"));

  if (isApiRoute && !isAllowedDomain) {
    // Return 403 for API routes accessed from unauthorized domains
    return new NextResponse(
      JSON.stringify({ error: "API access is restricted to api.myrbw.dev" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle subdomain routing for both public and dashboard routes
  if (
    sub &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/api/")
  ) {
    const guildId = await resolveGuildId(sub);
    if (!guildId) {
      // Failed to resolve guild ID, return 404
      console.error(`[Proxy] Failed to resolve guild ID for subdomain "${sub}"`);
      return new NextResponse("Guild not found", { status: 404 });
    }

    const url = req.nextUrl.clone();
    
    // Determine the target route based on the pathname
    if (pathname.startsWith("/dashboard")) {
      // Dashboard routes should use the guild ID in the path for internal routing
      // But on subdomain, we want clean URLs, so we still rewrite but the browser URL stays clean
      url.pathname = pathname.replace(/^\/dashboard/, `/dashboard/${guildId}`);
    } else if (pathname.startsWith("/setup")) {
      // Setup route stays as-is (no guild ID needed)
      url.pathname = pathname;
    } else {
      // Public portal routes
      url.pathname =
        pathname === "/"
          ? `/public/${guildId}`
          : `/public/${guildId}${pathname}`;
    }

    const response = NextResponse.rewrite(url);

    // Only log in development for debugging
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Proxy] Rewriting ${host}${pathname} to ${url.pathname}`);
    }

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Ensure session cookie has correct domain for subdomain access
    const sessionCookie = req.cookies.get(COOKIE_NAME);
    if (sessionCookie && COOKIE_DOMAIN) {
      response.cookies.set(COOKIE_NAME, sessionCookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || process.env.FORCE_SECURE_COOKIES === "true",
        sameSite: process.env.COOKIE_SAME_SITE === "strict" ? "strict" as const : "lax" as const,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        domain: COOKIE_DOMAIN,
      });
    }

    return response;
  }

  // Only guard the dashboard subtree
  if (!pathname.startsWith("/dashboard")) {
    const response = NextResponse.next();
    // Add security headers for all responses
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
  }

  const session = req.cookies.get(COOKIE_NAME);

  if (!session?.value) {
    const setupUrl = new URL("/setup", req.url);
    setupUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(setupUrl);
  }

  // Basic session format validation
  // Session format: <base64(payload)>.<base64url(hmac)>
  const sessionParts = session.value.split('.');
  if (sessionParts.length !== 2) {
    // Invalid session format, redirect to setup
    const setupUrl = new URL("/setup", req.url);
    setupUrl.searchParams.set("redirect", pathname);
    setupUrl.searchParams.set("error", "invalid_session");
    return NextResponse.redirect(setupUrl);
  }

  // Check if session appears to be valid base64
  try {
    const [payload, signature] = sessionParts;
    if (!payload || !signature || payload.length < 1 || signature.length < 1) {
      throw new Error("Invalid session format");
    }
    // Basic base64 validation
    if (!/^[A-Za-z0-9+/=]+$/.test(payload) || !/^[A-Za-z0-9_-]+$/.test(signature)) {
      throw new Error("Invalid base64 format");
    }
  } catch (error) {
    // Invalid session format, redirect to setup
    const setupUrl = new URL("/setup", req.url);
    setupUrl.searchParams.set("redirect", pathname);
    setupUrl.searchParams.set("error", "invalid_session");
    return NextResponse.redirect(setupUrl);
  }

  const response = NextResponse.next();
  // Add security headers for authenticated dashboard
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
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