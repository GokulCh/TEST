/**
 * /api/db/guilds/[guildId]/seasons
 *
 * GET → { data: GameSeasonModel[] }
 * PUT → reconciles the guild's season list (see dbApi.seasons.sync); body: SeasonConfig[]
 *       or { seasons }. Responds with the list as the API stores it.
 */

import { dbApi } from "@/lib/server/api-client";
import type { SeasonConfig } from "@/lib/db-types";
import { guildRoute, HttpError } from "@/lib/server/guild-route";

export const GET = guildRoute(async ({ guildId }) => ({ data: await dbApi.seasons.list(guildId) }), "Failed to fetch seasons");

export const PUT = guildRoute(async ({ guildId, session, json }) => {
  const body = await json<SeasonConfig[] | { seasons?: SeasonConfig[] } | null>();
  const list = Array.isArray(body) ? body : (body?.seasons ?? []);
  if (!Array.isArray(list)) throw new HttpError(400, "Body must be a season list");
  if (list.some((s) => !s || typeof s !== "object" || typeof s.name !== "string" || !s.start_date)) {
    throw new HttpError(400, "Every season needs a name and start_date");
  }
  // Forward only the writable fields; the active flag travels as is_enabled.
  const clean: SeasonConfig[] = list.map((s) => ({
    id: s.id,
    number: s.number,
    name: s.name,
    description: s.description,
    start_date: s.start_date,
    end_date: s.end_date,
    is_enabled: !!s.is_enabled,
  }));
  return { data: await dbApi.as(session.userId).seasons.sync(guildId, clean) };
}, "Failed to save seasons");
