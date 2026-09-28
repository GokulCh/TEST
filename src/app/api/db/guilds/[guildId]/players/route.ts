/**
 * GET /api/db/guilds/[guildId]/players
 * Player configs + active-season stats for the registered players of a guild.
 *
 * Query params: limit (default 500), offset (default 0),
 *   search (username/nickname), rank (exact rank name)
 */

import { dbApi } from "@/lib/server/api-client";
import { guildRoute } from "@/lib/server/guild-route";

export const GET = guildRoute(
  async ({ guildId, req, intParam }) => {
    const limit = intParam("limit", 500, 1, 5000);
    const offset = intParam("offset", 0, 0, Number.MAX_SAFE_INTEGER);
    const search = (req.nextUrl.searchParams.get("search") ?? "").toLowerCase();
    const rank = req.nextUrl.searchParams.get("rank") ?? "";

    // The API pages every list (max 100/page), so walk all pages before filtering,
    // otherwise search/rank/total only see the first page.
    const [configs, stats] = await Promise.all([
      dbApi.players.listAllConfigByGuild(guildId),
      dbApi.players.listAllStatsByGuild(guildId),
    ]);
    const statOf = new Map(stats.map((s) => [s.player_id, s]));

    const matching = configs.filter(
      (c) =>
        (!search || c.username.toLowerCase().includes(search) || c.nickname?.toLowerCase().includes(search)) &&
        (!rank || statOf.get(c.player_id)?.rank === rank),
    );
    const page = matching.slice(offset, offset + limit);

    return {
      data: {
        configs: page,
        stats: page.flatMap((c) => statOf.get(c.player_id) ?? []),
        total: matching.length,
        hasMore: offset + limit < matching.length,
      },
    };
  },
  "Failed to fetch players",
  { cacheSeconds: 60 },
);
