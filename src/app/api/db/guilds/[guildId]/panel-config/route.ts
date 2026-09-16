/**
 * /api/db/guilds/[guildId]/panel-config
 *
 * GET  → returns GuildConfigModel (creates row if missing)
 * PUT  → saves one named section; body: { section: string; data: unknown }
 *
 * Sections: theme | leaderboards | domain | audit-settings | portal-settings | developer-config
 *
 * [guildId] is the DATABASE integer ID (string).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";
import type {
  PanelThemeConfig,
  LeaderboardDisplayConfig,
  PanelAuditSettings,
  PanelPortalSettings,
  DeveloperConfig,
} from "@/lib/db-types";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try { await requireAuth(); } catch (e) { return e as Response; }
  const { guildId } = await params;
  try {
    const cfg = await dbApi.panelConfig.getOrCreate(guildId);
    return NextResponse.json({ data: cfg });
  } catch (err: unknown) {
    const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : 500;
    return NextResponse.json({ error: "Failed to fetch panel config" }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try { await requireAuth(); } catch (e) { return e as Response; }
  const { guildId } = await params;

  let body: { section: string; data: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { section, data } = body;
  try {
    switch (section) {
      case "theme":
        await dbApi.panelConfig.saveTheme(guildId, data as PanelThemeConfig);
        break;
      case "leaderboards":
        await dbApi.panelConfig.saveLeaderboards(guildId, data as LeaderboardDisplayConfig[]);
        break;
      case "domain":
        await dbApi.panelConfig.setPublicDomain(guildId, data as string);
        break;
      case "audit-settings":
        await dbApi.panelConfig.saveAuditSettings(guildId, data as PanelAuditSettings);
        break;
      case "portal-settings":
        await dbApi.panelConfig.savePortalSettings(guildId, data as PanelPortalSettings);
        break;
      case "developer-config":
        await dbApi.panelConfig.saveDeveloperConfig(guildId, data as DeveloperConfig);
        break;
      default:
        return NextResponse.json({ error: `Unknown section: ${section}` }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : 500;
    return NextResponse.json({ error: `Failed to save panel config section: ${section}` }, { status });
  }
}
