/**
 * GET /api/db/guilds/[guildId]/events
 * Returns guild events (used as the audit log trail).
 *
 * Query params:
 *   limit  — default 50
 *   active — "true" to return only active events
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try { await requireAuth(); } catch (e) { return e as Response; }
  const { guildId } = await params;
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";

  try {
    const data = activeOnly
      ? await dbApi.guildEvents.listActive(guildId)
      : await dbApi.guildEvents.list(guildId, limit);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[events GET]", err);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
