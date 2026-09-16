/**
 * GET /api/db/guilds/[guildId]/stats
 * Returns aggregated overview stats for the guild dashboard.
 * Fetches: active game count, total game count, active strike count, player count.
 *
 * [guildId] is the DATABASE integer ID (string).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId } = await params;

  try {
    const [activeGames, totalGames, activeStrikes, players] =
      await Promise.allSettled([
        dbApi.games.listActive(guildId),
        dbApi.games.countTotal(guildId),
        dbApi.strikes.listActiveByGuild(guildId),
        dbApi.players.listConfigByGuild(guildId),
      ]);

    return NextResponse.json({
      data: {
        activeGames:
          activeGames.status === "fulfilled" ? activeGames.value.length : 0,
        totalGames:
          totalGames.status === "fulfilled" ? totalGames.value.count : 0,
        activeStrikes:
          activeStrikes.status === "fulfilled"
            ? activeStrikes.value.length
            : 0,
        registeredPlayers:
          players.status === "fulfilled" ? players.value.length : 0,
      },
    });
  } catch (err) {
    console.error("[stats GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch guild stats" },
      { status: 500 },
    );
  }
}
