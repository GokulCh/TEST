/**
 * GET /api/guilds
 * Returns the authenticated user's Discord guilds enriched with DB registration status.
 * Only returns guilds where the user has Manage Guild permission or is owner.
 *
 * Response shape:
 *   { guilds: PanelGuild[] }
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";
import {
  fetchUserGuilds,
  filterManageableGuilds,
  guildIconUrl,
} from "@/lib/server/discord-oauth";
import { dbApi } from "@/lib/server/api-client";
import { extractSubdomain } from "@/lib/portal-domain-utils";
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

    // A guild is registered when the API knows it (404 = not registered). The API
    // takes a snowflake as the guild id, so its DB id and portal subdomain are
    // fetched together, all guilds in parallel.
    const dbIdMap: Record<string, string> = {};
    const subdomainMap: Record<string, string> = {};
    await Promise.all(
      manageable.map(async (g) => {
        const [guild, domain] = await Promise.allSettled([
          dbApi.guilds.getBySnowflake(g.id),
          dbApi.guildConfig.getPublicDomain(g.id),
        ]);
        if (guild.status !== "fulfilled") return;
        dbIdMap[g.id] = String(guild.value.id);
        const subdomain = domain.status === "fulfilled" && domain.value ? extractSubdomain(domain.value) : null;
        if (subdomain) subdomainMap[g.id] = subdomain;
      }),
    );

    const panelGuilds: PanelGuild[] = manageable.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      iconUrl: guildIconUrl(g.id, g.icon, 64),
      owner: g.owner,
      permissions: g.permissions,
      isRegistered: g.id in dbIdMap,
      dbId: dbIdMap[g.id],
      subdomain: subdomainMap[g.id],
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
