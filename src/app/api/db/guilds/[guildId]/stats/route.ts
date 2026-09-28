/**
 * GET /api/db/guilds/[guildId]/stats
 * Overview numbers for the dashboard: active games, total games, active strikes, registered players.
 */

import { dbApi, isActiveStrike } from "@/lib/server/api-client";
import { guildRoute } from "@/lib/server/guild-route";

export const GET = guildRoute(
  async ({ guildId }) => {
    // Counts come from count endpoints / every page: list endpoints are capped by
    // the API (default 100), which would silently understate the totals. A failed
    // piece counts as 0 so one slow table cannot blank the dashboard.
    const [waiting, inProgress, total, strikes, players] = await Promise.allSettled([
      dbApi.games.countByStatus(guildId, "waiting"),
      dbApi.games.countByStatus(guildId, "in_progress"),
      dbApi.games.countTotal(guildId),
      dbApi.strikes.listAll(guildId),
      dbApi.players.count(guildId),
    ]);
    const count = (r: PromiseSettledResult<{ count: number }>) => (r.status === "fulfilled" ? r.value.count : 0);
    return {
      data: {
        activeGames: count(waiting) + count(inProgress),
        totalGames: count(total),
        activeStrikes: strikes.status === "fulfilled" ? strikes.value.filter(isActiveStrike).length : 0,
        registeredPlayers: count(players),
      },
    };
  },
  "Failed to fetch guild stats",
  { cacheSeconds: 30 },
);
