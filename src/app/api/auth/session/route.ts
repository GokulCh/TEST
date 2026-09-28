/**
 * GET /api/auth/session
 * Returns the current authenticated session (user info only — no tokens).
 * Returns { session: null } when not authenticated.
 *
 * POST /api/auth/login
 * Initiates the Discord OAuth flow by generating a CSRF state token,
 * storing it in a short-lived cookie, and returning the authorization URL.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { isDeveloper } from "@/lib/server/developer";
import { buildAuthorizationUrl } from "@/lib/server/discord-oauth";
import { applyRateLimit, RateLimitPresets } from "@/lib/server/rate-limit";

export async function GET(req: Request) {
  try {
    await applyRateLimit(req, RateLimitPresets.api);
  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: Math.ceil((error.reset - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': error.limit.toString(),
            'X-RateLimit-Remaining': error.remaining.toString(),
            'X-RateLimit-Reset': error.reset.toString(),
            'Retry-After': Math.ceil((error.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }
  }

  const session = await getSession();

  if (!session) {
    return NextResponse.json({ session: null });
  }

  // Return safe public fields only — never expose tokens
  return NextResponse.json({
    session: {
      userId: session.userId,
      username: session.username,
      globalName: session.globalName,
      discriminator: session.discriminator,
      avatar: session.avatar,
      avatarUrl: session.avatarUrl,
      playerAppearance: session.playerAppearance,
      isDeveloper: isDeveloper(session.userId),
    },
  });
}

export async function POST(req: Request) {
  try {
    await applyRateLimit(req, RateLimitPresets.auth);
  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: Math.ceil((error.reset - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': error.limit.toString(),
            'X-RateLimit-Remaining': error.remaining.toString(),
            'X-RateLimit-Reset': error.reset.toString(),
            'Retry-After': Math.ceil((error.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }
  }

  // Generate a cryptographically random state token for CSRF protection
  const stateBytes = new Uint8Array(16);
  crypto.getRandomValues(stateBytes);
  const state = Buffer.from(stateBytes).toString("hex");

  const authUrl = buildAuthorizationUrl(state);

  const response = NextResponse.json({ url: authUrl });

  // Store the state in a short-lived HTTP-only cookie (10 minutes)
  const cookieSecure = process.env.NODE_ENV === "production" || process.env.FORCE_SECURE_COOKIES === "true";
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
