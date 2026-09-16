/**
 * GET /api/db/guilds/[guildId]/games
 * Returns game instances (with optional participants) for a guild.
 *
 * Query params:
 *   limit        — default 50
 *   offset       — default 0
 *   participants — "true" to include participant data (slower)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAuth(); } catch (e) { return e as Response; }
  const { guildId } = await params;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
  const withParticipants = req.nextUrl.searchParams.get("participants") === "true";

  try {
    const gameList = await dbApi.games.list(guildId, limit, offset);

    if (!withParticipants) {
      return NextResponse.json({ data: { games: gameList } });
    }

    // Load participants for the first 20 games in parallel (cap to avoid overloading)
    const capped = gameList.slice(0, 20);
    const participantResults = await Promise.allSettled(
      capped.map((g) => dbApi.games.getParticipantsWithPlayers(g.id))
    );

    const gamesWithParticipants = capped.map((game, i) => ({
      ...game,
      participants: participantResults[i].status === "fulfilled" ? participantResults[i].value : [],
    }));

    return NextResponse.json({ data: { games: gamesWithParticipants } });
  } catch (err) {
    console.error("[games GET]", err);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}
