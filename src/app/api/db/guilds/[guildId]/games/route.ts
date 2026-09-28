/**
 * GET /api/db/guilds/[guildId]/games
 * Game instances (optionally with participants) of a guild.
 *
 * Query params: limit (default 50), offset (default 0), status (optional),
 *   participants ("true" adds participants + usernames to the first 20 games)
 */

import { dbApi } from "@/lib/server/api-client";
import { guildRoute, HttpError } from "@/lib/server/guild-route";

const STATUSES = ["waiting", "in_progress", "completed", "cancelled"];

export const GET = guildRoute(
  async ({ guildId, req, intParam }) => {
    const limit = intParam("limit", 50, 1, 1000);
    const offset = intParam("offset", 0, 0, Number.MAX_SAFE_INTEGER);
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    if (status && !STATUSES.includes(status)) throw new HttpError(400, "Invalid game status");

    // Page and filter on the server: filtering after a page slice would drop matches.
    const games = await dbApi.games.list(guildId, limit, offset, status);
    if (req.nextUrl.searchParams.get("participants") !== "true") return { data: { games } };

    // Capped to the first 20 games to avoid overloading the API.
    const capped = games.slice(0, 20);
    const participants = await dbApi.games.participantsWithUsernames(guildId, capped.map((g) => g.id));
    return { data: { games: capped.map((game, i) => ({ ...game, participants: participants[i] })) } };
  },
  "Failed to fetch games",
  { cacheSeconds: 30 },
);
