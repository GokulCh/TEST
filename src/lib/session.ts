/**
 * Server-side session management using a signed HTTP-only cookie.
 * We avoid external session libraries to keep the dependency surface minimal —
 * the session payload is JSON-stringified, base64-encoded, and HMAC-SHA256
 * signed, then stored in a single cookie.
 *
 * Cookie format:  <base64(payload)>.<base64url(hmac)>
 *
 * Usage (API route / Server Component):
 *   import { getSession, setSession, clearSession } from "@/lib/session";
 */

import { cookies } from "next/headers";
import type { SessionData } from "@/lib/db-types";

const COOKIE_NAME = "rbw_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ── HMAC helpers ──────────────────────────────────────────────────────────────

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await importKey(getSecret());
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Buffer.from(sig).toString("base64url");
}

async function verify(payload: string, signature: string): Promise<boolean> {
  const key = await importKey(getSecret());
  const enc = new TextEncoder();
  const sigBytes = Buffer.from(signature, "base64url");
  return crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
}

// ── Encode / decode ───────────────────────────────────────────────────────────

async function encode(data: SessionData): Promise<string> {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64");
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

async function decode(cookie: string): Promise<SessionData | null> {
  const dot = cookie.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);

  const ok = await verify(payload, sig);
  if (!ok) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as SessionData;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Reads and validates the session cookie. Returns null if absent or tampered.
 */
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return decode(raw);
}

/**
 * Writes an encoded session cookie.  Call from API routes only.
 */
export async function setSession(data: SessionData): Promise<void> {
  const value = await encode(data);
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Returns a 7-day expiry timestamp (Unix ms) based on the token's expires_in.
 */
export function tokenExpiresAt(expiresInSeconds: number): number {
  return Date.now() + expiresInSeconds * 1000;
}

/**
 * True when the access token will expire within the next 5 minutes.
 */
export function isTokenExpiringSoon(expiresAt: number): boolean {
  return expiresAt - Date.now() < 5 * 60 * 1000;
}
