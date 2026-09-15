/**
 * GET /api/db/guilds/[guildId]/strikes
 * Returns all strike records for a guild from player_strikes.
 *
 * Query params:
 *   state  — filter: active | all (default: all)
 *   limit  — default 100
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAuth(); } catch (e) { return e as Response; }
  const { guildId } = await params;
  const state = req.nextUrl.searchParams.get("state") ?? "all";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "100");

  try {
    const data = state === "active"
      ? await dbApi.strikes.listActiveByGuild(guildId)
      : await dbApi.strikes.listByGuild(guildId, limit);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[strikes GET]", err);
    return NextResponse.json({ error: "Failed to fetch strikes" }, { status: 500 });
  }
}
