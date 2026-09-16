/**
 * GET /api/guilds
 * Returns the authenticated user's Discord guilds enriched with DB registration status.
 * Only returns guilds where the user has Manage Guild permission or is owner.
 *
 * Response shape:
 *   { guilds: PanelGuild[] }
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireInternalAuth";
import {
  fetchUserGuilds,
  filterManageableGuilds,
  guildIconUrl,
} from "@/lib/discord-oauth";
import { dbApi } from "@/lib/api-client";
import type { PanelGuild } from "@/lib/db-types";

export async function GET() {
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    return err as Response;
  }

  try {
    // Fetch all guilds the user belongs to from Discord
    const allGuilds = await fetchUserGuilds(session.accessToken);

    // Keep only guilds where the user can manage settings
    const manageable = filterManageableGuilds(allGuilds);

    if (manageable.length === 0) {
      return NextResponse.json({ guilds: [] });
    }

    // Check which guilds are already registered in the database
    const snowflakeIds = manageable.map((g) => g.id);
    const registrationMap = await dbApi.guilds.checkRegistrationBatch(snowflakeIds);

    // Fetch DB IDs for registered guilds in parallel (needed for navigation)
    const dbIdMap: Record<string, string> = {};
    await Promise.allSettled(
      manageable
        .filter((g) => registrationMap[g.id])
        .map(async (g) => {
          try {
            const guild = await dbApi.guilds.getBySnowflake(g.id);
            dbIdMap[g.id] = guild.id;
          } catch {
            // ignore — guild exists check may have been stale
          }
        }),
    );

    const panelGuilds: PanelGuild[] = manageable.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      iconUrl: guildIconUrl(g.id, g.icon, 64),
      owner: g.owner,
      permissions: g.permissions,
      isRegistered: registrationMap[g.id] ?? false,
      dbId: dbIdMap[g.id],
    }));

    return NextResponse.json({ guilds: panelGuilds });
  } catch (err) {
    console.error("[/api/guilds] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch guilds" },
      { status: 500 },
    );
  }
}
