/**
 * GET /api/db/guilds/[guildId]/players
 * Returns player configs + latest stats for all registered players in a guild.
 * Used by matchmaking/players page.
 *
 * Query params:
 *   limit (default 500)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAuth(); } catch (e) { return e as Response; }
  const { guildId } = await params;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "500");

  try {
    const [configs, stats] = await Promise.allSettled([
      dbApi.players.listConfigByGuild(guildId, limit),
      dbApi.players.listStatsByGuild(guildId, limit),
    ]);

    return NextResponse.json({
      data: {
        configs: configs.status === "fulfilled" ? configs.value : [],
        stats: stats.status === "fulfilled" ? stats.value : [],
      },
    });
  } catch (err) {
    console.error("[players GET]", err);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
