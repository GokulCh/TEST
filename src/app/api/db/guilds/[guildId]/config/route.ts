/**
 * /api/db/guilds/[guildId]/config
 *
 * GET  → returns full GuildConfigModel for the guild
 * PUT  → replaces one named section; body: { section: string; data: unknown }
 *
 * Supported section names (maps to DB API paths):
 *   prefix, prefix-enabled, slash-enabled,
 *   appearance, requirements, commands, permissions,
 *   registration-verification, elo-engine, flows,
 *   punishment-ladder, strike-ladder, panels,
 *   interactive-panels, reactions, embed, banner-layouts,
 *   settings-restrictions, account-age-whitelist
 *
 * [guildId] here is the DATABASE integer ID (string), not the Discord snowflake.
 * The front-end uses the dbId returned by /api/guilds.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import { dbApi } from "@/lib/api-client";

type Params = { params: Promise<{ guildId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { guildId } = await params;

  try {
    const config = await dbApi.guildConfig.get(guildId);
    return NextResponse.json({ data: config });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: "Failed to fetch guild config" },
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
      case "prefix":
        await dbApi.guildConfig.updatePrefix(guildId, data as string);
        break;
      case "prefix-enabled":
        await dbApi.guildConfig.updatePrefixEnabled(guildId, data as boolean);
        break;
      case "slash-enabled":
        await dbApi.guildConfig.updateSlashEnabled(guildId, data as boolean);
        break;
      case "appearance":
        await dbApi.guildConfig.saveAppearance(guildId, data as Parameters<typeof dbApi.guildConfig.saveAppearance>[1]);
        break;
      case "requirements":
        await dbApi.guildConfig.saveRequirements(guildId, data as Parameters<typeof dbApi.guildConfig.saveRequirements>[1]);
        break;
      case "commands":
        await dbApi.guildConfig.saveCommands(guildId, data as Parameters<typeof dbApi.guildConfig.saveCommands>[1]);
        break;
      case "permissions":
        await dbApi.guildConfig.savePermissions(guildId, data as Parameters<typeof dbApi.guildConfig.savePermissions>[1]);
        break;
      case "registration-verification":
        await dbApi.guildConfig.saveRegistrationVerification(guildId, data as Parameters<typeof dbApi.guildConfig.saveRegistrationVerification>[1]);
        break;
      case "elo-engine":
        await dbApi.guildConfig.saveEloEngine(guildId, data as Parameters<typeof dbApi.guildConfig.saveEloEngine>[1]);
        break;
      case "flows":
        await dbApi.guildConfig.saveFlows(guildId, data as Parameters<typeof dbApi.guildConfig.saveFlows>[1]);
        break;
      case "punishment-ladder":
        await dbApi.guildConfig.savePunishmentLadder(guildId, data as Parameters<typeof dbApi.guildConfig.savePunishmentLadder>[1]);
        break;
      case "strike-ladder":
        await dbApi.guildConfig.saveStrikeLadder(guildId, data as Parameters<typeof dbApi.guildConfig.saveStrikeLadder>[1]);
        break;
      case "panels":
        await dbApi.guildConfig.savePanels(guildId, data as Parameters<typeof dbApi.guildConfig.savePanels>[1]);
        break;
      case "interactive-panels":
        await dbApi.guildConfig.saveInteractivePanels(guildId, data as Parameters<typeof dbApi.guildConfig.saveInteractivePanels>[1]);
        break;
      case "reactions":
        await dbApi.guildConfig.saveReactions(guildId, data as Parameters<typeof dbApi.guildConfig.saveReactions>[1]);
        break;
      case "embed":
        await dbApi.guildConfig.saveEmbed(guildId, data as Parameters<typeof dbApi.guildConfig.saveEmbed>[1]);
        break;
      case "banner-layouts":
        await dbApi.guildConfig.saveBannerLayouts(guildId, data as Parameters<typeof dbApi.guildConfig.saveBannerLayouts>[1]);
        break;
      case "settings-restrictions":
        await dbApi.guildConfig.saveSettingsRestrictions(guildId, data as Parameters<typeof dbApi.guildConfig.saveSettingsRestrictions>[1]);
        break;
      case "account-age-whitelist":
        await dbApi.guildConfig.saveAccountAgeWhitelist(guildId, data as Parameters<typeof dbApi.guildConfig.saveAccountAgeWhitelist>[1]);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown config section: ${section}` },
          { status: 400 },
        );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error(`[config PUT section=${section}]`, err);
    const status =
      err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 500;
    return NextResponse.json(
      { error: `Failed to save config section: ${section}` },
      { status },
    );
  }
}
