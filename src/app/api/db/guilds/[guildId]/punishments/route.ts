/**
 * GET /api/db/guilds/[guildId]/punishments
 * Returns all punishment records for a guild from player_punishments.
 *
 * Query params:
 *   limit  — default 100
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAuth(); } catch (e) { return e as Response; }
  const { guildId } = await params;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "100");

  try {
    const data = await dbApi.punishments.listByGuild(guildId, limit);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[punishments GET]", err);
    return NextResponse.json({ error: "Failed to fetch punishments" }, { status: 500 });
  }
}
