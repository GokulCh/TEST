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
import { getSession } from "@/lib/session";
import { buildAuthorizationUrl } from "@/lib/discord-oauth";

export async function GET() {
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
    },
  });
}

export async function POST() {
  // Generate a cryptographically random state token for CSRF protection
  const stateBytes = new Uint8Array(16);
  crypto.getRandomValues(stateBytes);
  const state = Buffer.from(stateBytes).toString("hex");

  const authUrl = buildAuthorizationUrl(state);

  const response = NextResponse.json({ url: authUrl });

  // Store the state in a short-lived HTTP-only cookie (10 minutes)
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
