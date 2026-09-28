/**
 * POST /api/auth/logout
 * Revokes the Discord access token and clears the session cookie.
 * Enhanced for multi-user scenarios with proper resource cleanup.
 */

import { NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/server/session";
import { revokeToken } from "@/lib/server/discord-oauth";
import { cleanupUserSession } from "@/lib/server/session-cleanup";

export async function POST() {
  const session = await getSession();

  if (session) {
    // Best-effort token revocation — don't block logout if it fails
    revokeToken(session.accessToken).catch(() => {});
    
    // Clean up user-specific resources for multi-user scenarios
    cleanupUserSession(session.userId);
  }

  await clearSession();

  return NextResponse.json({ ok: true });
}
