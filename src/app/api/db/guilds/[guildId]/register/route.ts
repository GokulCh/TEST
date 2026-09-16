/**
 * POST /api/db/guilds/[guildId]/register
 * Registers a Discord server in the database for the first time.
 *
 * Body: { snowflakeId: string; name: string }
 * Response: { guild: GuildModel }
 *
 * [guildId] in the path is the Discord snowflake ID (used only for routing
 * clarity; the actual snowflakeId comes from the body for safety).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi, ApiError } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId: snowflakeId } = await params;

  let body: { name: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Guild name is required" },
      { status: 400 },
    );
  }

  try {
    const guild = await dbApi.registerGuild(snowflakeId, name.trim());
    return NextResponse.json({ guild }, { status: 201 });
  } catch (err) {
    console.error("[register POST]", err);
    const status = err instanceof ApiError ? err.status : 500;
    const errorMessage = err instanceof ApiError && err.isNotFound 
      ? "Database API endpoint not found" 
      : err instanceof ApiError 
        ? `Database API error: ${err.message}` 
        : "Failed to register guild";
    
    return NextResponse.json(
      { error: errorMessage },
      { status },
    );
  }
}
