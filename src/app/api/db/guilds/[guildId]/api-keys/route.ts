/**
 * /api/db/guilds/[guildId]/api-keys
 *
 * GET    → the guild's API keys
 * POST   → creates a key; the full key is in the response once
 * PUT    → enables/disables a key; body: { keyId, is_active }
 * DELETE → deletes a key; ?keyId=
 *
 * The Database API only issues guild keys: read_only and bound to this guild.
 */

import { dbApi } from "@/lib/server/api-client";
import type { PlayerApiKeyInput, PlayerApiKeyWithSecret } from "@/lib/db-types";
import { guildRoute, HttpError } from "@/lib/server/guild-route";

const isKeyId = (v: unknown) => /^\d+$/.test(String(v ?? ""));

export const GET = guildRoute(({ guildId }) => dbApi.apiKeys.listAll(guildId), "Failed to fetch API keys");

export const POST = guildRoute(async ({ guildId, session, json }) => {
  const body = await json<PlayerApiKeyInput>();
  if (!body.name || body.name.trim().length === 0 || body.name.length > 100) {
    throw new HttpError(400, "Name is required (max 100 characters)");
  }
  const expiresAt = body.expires_at ? new Date(body.expires_at) : null;
  if (expiresAt && (isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
    throw new HttpError(400, "expires_at must be a future date");
  }
  const created = await dbApi.as(session.userId).apiKeys.create(guildId, body.name.trim(), expiresAt);
  return { api_key: created.key, key_info: created.api_key } satisfies PlayerApiKeyWithSecret;
}, "Failed to create API key");

export const PUT = guildRoute(async ({ guildId, session, json }) => {
  const { keyId, is_active } = await json<{ keyId?: unknown; is_active?: unknown }>();
  if (!isKeyId(keyId)) throw new HttpError(400, "Valid key ID is required");
  if (typeof is_active !== "boolean") throw new HttpError(400, "is_active (boolean) is required");
  // A key an administrator disabled must not be re-enabled from the panel.
  if (is_active && (await dbApi.apiKeys.get(guildId, String(keyId))).admin_disabled) {
    throw new HttpError(403, "This key was disabled by an administrator");
  }
  return dbApi.as(session.userId).apiKeys.setActive(guildId, String(keyId), is_active);
}, "Failed to update API key");

export const DELETE = guildRoute(async ({ guildId, session, req }) => {
  const keyId = req.nextUrl.searchParams.get("keyId");
  if (!isKeyId(keyId)) throw new HttpError(400, "Valid key ID is required");
  await dbApi.as(session.userId).apiKeys.remove(guildId, keyId!);
  return { success: true };
}, "Failed to delete API key");
