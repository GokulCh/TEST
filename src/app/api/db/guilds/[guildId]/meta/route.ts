/**
 * /api/db/guilds/[guildId]/meta
 *
 * GET  → returns GameMetaModel
 * PUT  → replaces one named section; body: { section: string; data: unknown }
 *
 * Supported sections: modes, maps, ranks, seasons
 *
 * [guildId] is the DATABASE integer ID (string).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";
import type { ModeConfig, MapConfig, RankConfig, SeasonConfig, GameServerConfig, BotStoredConfig } from "@/lib/db-types";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId } = await params;

  try {
    const meta = await dbApi.gameMeta.get(guildId);
    return NextResponse.json({ data: meta });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Failed to fetch game meta" },
      { status },
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId } = await params;

  let body: { section: string; data: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { section, data } = body;

  try {
    switch (section) {
      case "modes":
        await dbApi.gameMeta.saveModes(guildId, data as ModeConfig[]);
        break;
      case "maps":
        await dbApi.gameMeta.saveMaps(guildId, data as MapConfig[]);
        break;
      case "ranks":
        await dbApi.gameMeta.saveRanks(guildId, data as RankConfig[]);
        break;
      case "seasons":
        await dbApi.gameMeta.saveSeasons(guildId, data as SeasonConfig[]);
        break;
      case "server":
        await dbApi.gameMeta.saveServer(guildId, data as Parameters<typeof dbApi.gameMeta.saveServer>[1]);
        break;
      case "bots":
        await dbApi.gameMeta.saveBots(guildId, data as Parameters<typeof dbApi.gameMeta.saveBots>[1]);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown meta section: ${section}` },
          { status: 400 },
        );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error(`[meta PUT section=${section}]`, err);
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: `Failed to save meta section: ${section}` },
      { status },
    );
  }
}
