import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession, setSession, clearSession, isTokenExpiringSoon } from "@/lib/session";
import { refreshAccessToken } from "@/lib/discord-oauth";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/setup/complete",
];

// Routes that are always public (no auth needed)
const PUBLIC_ROUTES = [
  "/",
  "/setup",
  "/api/auth",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host")?.split(":")[0] ?? "";

  // Map configured subdomains to the isolated public portal route tree.
  // The explicit /public/[guildId] path remains available for previews and local testing.
  if (host.endsWith(".myrbw.dev") && !pathname.startsWith("/public/") && !pathname.startsWith("/_next/") && !pathname.startsWith("/api/")) {
    const guildSlug = host.slice(0, -".myrbw.dev".length);
    if (guildSlug && guildSlug !== "www") {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = `/public/${guildSlug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // Allow public routes to pass through
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    const session = await getSession();

    if (!session) {
      // No session found, redirect to setup/login
      const url = new URL("/setup", req.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Check if access token is expiring soon and refresh if needed
    if (isTokenExpiringSoon(session.expiresAt) && session.refreshToken) {
      try {
        const newTokens = await refreshAccessToken(session.refreshToken);

        // Update session with new tokens
        await setSession({
          userId: session.userId,
          username: session.username,
          globalName: session.globalName,
          discriminator: session.discriminator,
          avatar: session.avatar,
          avatarUrl: session.avatarUrl,
          accessToken: newTokens.access_token,
          refreshToken: newTokens.refresh_token || session.refreshToken,
          expiresAt: Date.now() + (newTokens.expires_in * 1000),
          playerAppearance: session.playerAppearance, // Preserve player appearance data
        });

        // Continue with refreshed session
        return NextResponse.next();
      } catch (refreshError) {
        console.error("[middleware] Token refresh failed:", refreshError);

        // If refresh fails, clear session and redirect to login
        await clearSession();
        const url = new URL("/setup", req.url);
        url.searchParams.set("redirect", pathname);
        url.searchParams.set("error", "session_expired");
        return NextResponse.redirect(url);
      }
    }

    // Session is valid, continue
    return NextResponse.next();
  } catch (error) {
    console.error("[middleware] Session check failed:", error);
    
    // On any error, redirect to setup
    const url = new URL("/setup", req.url);
    url.searchParams.set("redirect", pathname);
    url.searchParams.set("error", "auth_error");
    return NextResponse.redirect(url);
  }
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
