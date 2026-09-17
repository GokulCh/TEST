import { NextResponse } from "next/server"
import { dbApi } from "@/lib/api-client"

type Params = { params: Promise<{ guildId: string }> }

export async function GET(req: Request, { params }: Params) {
  const { guildId } = await params
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "500")

  try {
    const [configs, stats] = await Promise.all([
      dbApi.players.listConfigByGuild(guildId, limit),
      dbApi.players.listStatsByGuild(guildId, limit),
    ])

    return NextResponse.json({ data: { configs, stats } })
  } catch (error) {
    console.error("[public players GET]", error)
    return NextResponse.json({ error: "Failed to fetch public players" }, { status: 500 })
  }
}
