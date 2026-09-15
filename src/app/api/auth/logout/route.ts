/**
 * POST /api/auth/logout
 * Revokes the Discord access token and clears the session cookie.
 */

import { NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/session";
import { revokeToken } from "@/lib/discord-oauth";

export async function POST() {
  const session = await getSession();

  if (session) {
    // Best-effort token revocation — don't block logout if it fails
    revokeToken(session.accessToken).catch(() => {});
  }

  await clearSession();

  return NextResponse.json({ ok: true });
}
