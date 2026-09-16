/**
 * Server-side guard for API routes and Server Components that require
 * a valid authenticated session.
 *
 * Usage in an API route:
 *   const session = await requireAuth();   // throws NextResponse 401 if not authed
 *
 * Usage in a Server Component (just returns null instead of throwing):
 *   const session = await getSessionOrNull();
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  isTokenExpiringSoon,
  setSession,
  tokenExpiresAt,
} from "@/lib/session";
import { refreshAccessToken, userAvatarUrl } from "@/lib/discord-oauth";
import type { SessionData } from "@/lib/db-types";

/**
 * Returns the session if authenticated, or throws a 401 NextResponse.
 * Also silently refreshes the access token when it is expiring soon.
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Refresh token if it expires within 5 minutes
  if (isTokenExpiringSoon(session.expiresAt)) {
    try {
      const tokens = await refreshAccessToken(session.refreshToken);
      const updated: SessionData = {
        ...session,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokenExpiresAt(tokens.expires_in),
        avatarUrl: userAvatarUrl(
          session.userId,
          session.avatar,
          session.discriminator,
        ),
        playerAppearance: session.playerAppearance, // Preserve player appearance data
      };
      await setSession(updated);
      return updated;
    } catch {
      // If refresh fails, the user needs to log in again
      throw NextResponse.json({ error: "Session expired" }, { status: 401 });
    }
  }

  return session;
}

/**
 * Returns the session or null — never throws.
 * Use in Server Components where a redirect is preferable to a thrown response.
 */
export async function getSessionOrNull(): Promise<SessionData | null> {
  try {
    return await getSession();
  } catch {
    return null;
  }
}
