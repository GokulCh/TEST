import { NextResponse } from "next/server"
import { dbApi } from "@/lib/api-client"

type Params = { params: Promise<{ guildId: string }> }

export async function GET(req: Request, { params }: Params) {
  const { guildId } = await params
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "20")
  const offset = Number(new URL(req.url).searchParams.get("offset") ?? "0")

  try {
    const games = await dbApi.games.list(guildId, limit, offset)
    return NextResponse.json({ data: games })
  } catch (error) {
    console.error("[public games GET]", error)
    return NextResponse.json({ error: "Failed to fetch public games" }, { status: 500 })
  }
}
