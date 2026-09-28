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
  
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "20")
  const offset = Number(new URL(req.url).searchParams.get("offset") ?? "0")
  
  // Validate pagination parameters
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: "Limit must be between 1 and 100" }, { status: 400 })
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ error: "Offset must be non-negative" }, { status: 400 })
  }

  try {
    const games = await dbApi.games.list(guildId, limit, offset)
    return NextResponse.json({ data: games })
  } catch (error) {
    console.error("[public games GET]", error)
    return NextResponse.json({ error: "Failed to fetch public games" }, { status: 500 })
  }
}
