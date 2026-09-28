/**
 * /api/db/guilds/[guildId]/snapshot
 *
 * GET  → { data } channels, categories, roles and threads the bot last reported
 * PUT  → writes the collections present in the body; the rest are left untouched
 */

import { dbApi } from "@/lib/server/api-client";
import { guildRoute, HttpError, ok } from "@/lib/server/guild-route";

const COLLECTIONS = ["channels", "categories", "roles", "threads"];

export const GET = guildRoute(async ({ guildId }) => ({ data: await dbApi.guilds.getSnapshot(guildId) }), "Failed to fetch snapshot");

export const PUT = guildRoute(async ({ guildId, session, json }) => {
  const body = await json<Record<string, unknown> | null>();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "Body must be an object");
  const state = Object.fromEntries(COLLECTIONS.filter((k) => body[k] != null).map((k) => [k, body[k]]));
  if (!Object.keys(state).length) throw new HttpError(400, "No snapshot collections provided");
  await dbApi.as(session.userId).guilds.saveSnapshotState(guildId, state);
  return ok;
}, "Failed to update snapshot");
