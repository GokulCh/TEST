import { NextResponse } from "next/server"
import { dbApi } from "@/lib/api-client"

type Params = { params: Promise<{ guildId: string }> }

export async function GET(req: Request, { params }: Params) {
  const { guildId } = await params

  try {
    const [activeGames, totalGames, players] = await Promise.allSettled([
      dbApi.games.listActive(guildId),
      dbApi.games.countTotal(guildId),
      dbApi.players.listConfigByGuild(guildId),
    ])

    return NextResponse.json({
      data: {
        activeGames: activeGames.status === "fulfilled" ? activeGames.value.length : 0,
        totalGames: totalGames.status === "fulfilled" ? totalGames.value.count : 0,
        registeredPlayers: players.status === "fulfilled" ? players.value.length : 0,
      },
    })
  } catch (error) {
    console.error("[public stats GET]", error)
    return NextResponse.json({ error: "Failed to fetch public stats" }, { status: 500 })
  }
}
