/**
 * GET /api/db/guilds/[guildId]/strikes
 *
 * Query params: state (active | all, default all), limit (default: every
 * record, paged server-side), offset (with limit, returns a single page)
 */

import { dbApi, isActiveStrike } from "@/lib/server/api-client";
import { guildRoute } from "@/lib/server/guild-route";

export const GET = guildRoute(async ({ guildId, req, intParam }) => {
  const q = req.nextUrl.searchParams;
  const offset = intParam("offset", 0, 0, Number.MAX_SAFE_INTEGER);
  const limit = q.get("limit") ? intParam("limit", 100, 1, 1000) : undefined;

  // The API has no "active" filter, so that state is filtered here after paging every strike.
  if (q.get("state") === "active") {
    const active = (await dbApi.strikes.listAll(guildId)).filter(isActiveStrike);
    return { data: limit ? active.slice(offset, offset + limit) : active };
  }
  return { data: limit ? await dbApi.strikes.page(guildId, limit, offset) : await dbApi.strikes.listAll(guildId) };
}, "Failed to fetch strikes");
