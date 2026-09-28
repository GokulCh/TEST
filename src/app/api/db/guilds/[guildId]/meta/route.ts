/**
 * /api/db/guilds/[guildId]/meta
 *
 * GET  → the GameMetaModel
 * PUT  → replaces one named section; body: { section, data }
 *
 * Sections: modes, maps, ranks, server, bots, perks. Queues live at /matchmaking
 * and seasons (a guild table, not a game config field) at /seasons.
 */

import { dbApi } from "@/lib/server/api-client";
import { guildRoute } from "@/lib/server/guild-route";
import { plain, saveSection, type Section } from "@/lib/server/sections";

const SECTIONS: Record<string, Section> = Object.fromEntries(
  ["modes", "maps", "ranks", "server", "bots", "perks"].map((name) => [name, plain(name)]),
);

export const GET = guildRoute(async ({ guildId }) => ({ data: await dbApi.gameConfig.get(guildId) }), "Failed to fetch game meta");

export const PUT = guildRoute((ctx) => saveSection(ctx, "gameConfig", SECTIONS, "meta"), "Failed to save meta section");
