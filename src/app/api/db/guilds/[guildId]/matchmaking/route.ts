/**
 * /api/db/guilds/[guildId]/matchmaking
 *
 * GET  → { data: { queues: QueueConfig[] } }
 * PUT  → saves the queue architecture; body: { queues: QueueConfig[] }
 */

import { dbApi } from "@/lib/server/api-client";
import type { QueueConfig } from "@/lib/db-types";
import { guildRoute, HttpError, ok } from "@/lib/server/guild-route";

export const GET = guildRoute(
  async ({ guildId }) => ({ data: { queues: await dbApi.gameConfig.field<QueueConfig[]>(guildId, "queues") } }),
  "Failed to fetch game config",
);

export const PUT = guildRoute(async ({ guildId, session, json }) => {
  const body = await json<{ queues?: QueueConfig[] } | null>();
  if (!Array.isArray(body?.queues)) throw new HttpError(400, "queues must be an array");
  await dbApi.as(session.userId).gameConfig.saveField(guildId, "queues", body.queues);
  return ok;
}, "Failed to save queues");
