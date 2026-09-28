/**
 * GET /api/db/guilds/[guildId]/punishments
 *
 * Query params: limit (default: every record, paged server-side),
 *   offset (with limit, returns a single page)
 */

import { dbApi } from "@/lib/server/api-client";
import { guildRoute } from "@/lib/server/guild-route";

export const GET = guildRoute(async ({ guildId, req, intParam }) => {
  if (!req.nextUrl.searchParams.get("limit")) return { data: await dbApi.punishments.listAll(guildId) };
  const page = await dbApi.punishments.page(guildId, intParam("limit", 100, 1, 1000), intParam("offset", 0, 0, Number.MAX_SAFE_INTEGER));
  return { data: page };
}, "Failed to fetch punishments");
