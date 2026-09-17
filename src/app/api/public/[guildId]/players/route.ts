import { NextResponse } from "next/server"
import { dbApi } from "@/lib/api-client"

type Params = { params: Promise<{ guildId: string }> }

export async function GET(req: Request, { params }: Params) {
  const { guildId } = await params
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "500")

  try {
    const guild = await dbApi.guilds.getBySnowflake(guildId)
    const lookupIds = [...new Set([String(guild.id), guildId])]
    
    const results = await Promise.all(lookupIds.map(async (lookupId) => Promise.allSettled([
      dbApi.players.listConfigByGuild(lookupId, limit),
      dbApi.players.listStatsByGuild(lookupId, limit),
    ])))
    
    const configs = results.flatMap((result) => result[0].status === "fulfilled" ? result[0].value : [])
    const stats = results.flatMap((result) => result[1].status === "fulfilled" ? result[1].value : [])

    return NextResponse.json({ data: { configs, stats } })
  } catch (error) {
    console.error("[public players GET]", error)
    return NextResponse.json({ error: "Failed to fetch public players" }, { status: 500 })
  }
}
