/**
 * /api/db/guilds/[guildId]/config
 *
 * GET  → the full GuildConfigModel (developer_config only for the developer)
 * PUT  → replaces one named section; body: { section, data }
 *
 * Each section is one guild config field: the editor sections in CONFIG_FIELDS
 * and the portal ones in PANEL_FIELDS (theme, leaderboards, domain, audit and
 * portal settings). developer_config is developer-only: use /developer-config.
 * [guildId] is the database id returned by /api/guilds.
 */

import { ApiError, dbApi } from "@/lib/server/api-client";
import { CONFIG_FIELDS, PANEL_FIELDS, type ConfigSection, type PanelSection } from "@/lib/config-sections";
import { extractSubdomain, isReservedSubdomain, isValidSubdomain } from "@/lib/portal-domain-utils";
import { invalidatePortalDomainsCache } from "@/lib/server/portal-domains";
import { stripDeveloperConfig } from "@/lib/server/developer";
import { guildRoute, HttpError, ok, type GuildContext } from "@/lib/server/guild-route";
import { saveSection, type Section } from "@/lib/server/sections";

const isBool = (name: string): Section["check"] => (v) => (typeof v === "boolean" ? undefined : `${name} must be a boolean`);

const CHECKS: Partial<Record<ConfigSection | PanelSection, Section["check"]>> = {
  prefix: (v) => (typeof v === "string" && [...v].length >= 1 && [...v].length <= 10 ? undefined : "prefix must be 1-10 characters"),
  "prefix-enabled": isBool("prefix-enabled"),
  "slash-enabled": isBool("slash-enabled"),
  leaderboards: (v) => (Array.isArray(v) ? undefined : "leaderboards must be an array"),
};

const SECTIONS: Record<string, Section> = Object.fromEntries(
  Object.entries({ ...CONFIG_FIELDS, ...PANEL_FIELDS })
    .filter(([name]) => name !== "domain") // saved by saveDomain: it validates and claims the subdomain
    .map(([name, field]) => [name, { field, check: CHECKS[name as ConfigSection | PanelSection], nullable: name === "banner-layouts" }]),
);

/** Claims the guild's portal subdomain; an empty value (or null) releases it. */
async function saveDomain({ guildId, session }: GuildContext, data: unknown) {
  if (data === undefined) throw new HttpError(400, "data is required");
  const raw = typeof data === "string" ? data.trim() : "";
  const config = dbApi.as(session.userId).guildConfig;
  if (!raw) {
    await config.setPublicDomain(guildId, "");
  } else {
    const sub = extractSubdomain(raw);
    if (!sub || !isValidSubdomain(sub)) throw new HttpError(400, "Invalid subdomain. Use letters, numbers, and hyphens (no spaces).");
    if (isReservedSubdomain(sub)) throw new HttpError(409, `"${sub}" is a reserved subdomain and cannot be claimed.`);
    try {
      await config.setPublicDomain(guildId, sub);
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) throw new HttpError(409, "This subdomain is already taken. Please choose a different one.");
      throw err;
    }
  }
  // After the save, so the new domain resolves immediately.
  invalidatePortalDomainsCache();
  return ok;
}

export const GET = guildRoute(
  async ({ guildId, session }) => ({ data: stripDeveloperConfig(await dbApi.guildConfig.get(guildId), session.userId) }),
  "Failed to fetch guild config",
);

export const PUT = guildRoute(async (ctx) => {
  const body = await ctx.json<{ section?: unknown; data?: unknown } | null>();
  return body?.section === "domain" ? saveDomain(ctx, body.data) : saveSection(ctx, "guildConfig", SECTIONS, "config");
}, "Failed to save config section");
