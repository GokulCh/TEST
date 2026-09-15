/**
 * GET /api/auth/callback
 * Discord redirects here after the user authorizes.
 * Exchanges the code for tokens, fetches user info, writes the session cookie,
 * then redirects to /setup (the setup wizard will transition to SERVER_SELECT).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  fetchDiscordUser,
  userAvatarUrl,
} from "@/lib/discord-oauth";
import { setSession, tokenExpiresAt } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // ── Handle Discord errors (user denied, etc.) ────────────────────────────
  if (error) {
    return NextResponse.redirect(
      `${appUrl}/setup?error=${encodeURIComponent(error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/setup?error=missing_code`);
  }

  // ── Validate CSRF state ──────────────────────────────────────────────────
  const storedState = req.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${appUrl}/setup?error=invalid_state`);
  }

  try {
    // ── Exchange code for tokens ─────────────────────────────────────────
    const tokens = await exchangeCode(code);

    // ── Fetch Discord user profile ───────────────────────────────────────
    const user = await fetchDiscordUser(tokens.access_token);

    // ── Persist session cookie ───────────────────────────────────────────
    await setSession({
      userId: user.id,
      username: user.username,
      globalName: user.global_name,
      discriminator: user.discriminator,
      avatar: user.avatar,
      avatarUrl: userAvatarUrl(user.id, user.avatar, user.discriminator, 128),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokenExpiresAt(tokens.expires_in),
      playerAppearance: {}, // Initialize empty player appearance object
    });

    // ── Clear CSRF state cookie and redirect to setup ────────────────────
    const response = NextResponse.redirect(`${appUrl}/setup?step=server_select`);
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return response;
  } catch (err) {
    console.error("[auth/callback] error:", err);
    return NextResponse.redirect(`${appUrl}/setup?error=auth_failed`);
  }
}
