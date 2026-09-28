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
  
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "500")
  
  // Validate limit parameter
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    return NextResponse.json({ error: "Limit must be between 1 and 500" }, { status: 400 })
  }

  try {
    const guild = await dbApi.guilds.getBySnowflake(guildId)
    // The API resolves DB ids and snowflakes to the same guild, so one lookup is enough.
    const [configs, stats] = await Promise.all([
      dbApi.players.listConfigByGuild(String(guild.id), limit),
      dbApi.players.listStatsByGuild(String(guild.id), limit),
    ])

    return NextResponse.json({ data: { configs, stats } })
  } catch (error) {
    console.error("[public players GET]", error)
    return NextResponse.json({ error: "Failed to fetch public players" }, { status: 500 })
  }
}
