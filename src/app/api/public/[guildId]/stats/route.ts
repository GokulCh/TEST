import { NextResponse } from "next/server"
import { dbApi } from "@/lib/server/api-client"
import { applyRateLimit, RateLimitPresets } from "@/lib/server/rate-limit"

type Params = { params: Promise<{ guildId: string }> }

export async function GET(req: Request, { params }: Params) {
  try {
    await applyRateLimit(req, RateLimitPresets.public);
  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: Math.ceil((error.reset - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': error.limit.toString(),
            'X-RateLimit-Remaining': error.remaining.toString(),
            'X-RateLimit-Reset': error.reset.toString(),
            'Retry-After': Math.ceil((error.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }
  }

  const { guildId } = await params
  
  // Validate guildId format to prevent injection
  if (!/^\d+$/.test(guildId)) {
    return NextResponse.json({ error: "Invalid guild ID format" }, { status: 400 })
  }

  try {
    const [activeGames, totalGames, players] = await Promise.allSettled([
      dbApi.games.listActive(guildId),
      dbApi.games.countTotal(guildId),
      dbApi.players.count(guildId),
    ])

    return NextResponse.json({
      data: {
        activeGames: activeGames.status === "fulfilled" ? activeGames.value.length : 0,
        totalGames: totalGames.status === "fulfilled" ? totalGames.value.count : 0,
        registeredPlayers: players.status === "fulfilled" ? players.value.count : 0,
      },
    })
  } catch (error) {
    console.error("[public stats GET]", error)
    return NextResponse.json({ error: "Failed to fetch public stats" }, { status: 500 })
  }
}
