/**
 * Server-only registry of guild portal subdomains.
 *
 * Builds the subdomain → guild map from each guild's `public_domain` panel
 * config so that:
 *   - `prbw.myrbw.dev` resolves to the built-in preview portal, and
 *   - a subdomain a guild registers (e.g. `jartex.myrbw.dev`) resolves to that
 *     guild's real portal data.
 *
 * Results are cached globally for a short TTL to avoid fan-out DB calls on
 * every public page render. This module touches the DB API and must only be
 * imported from server code.
 */

import { dbApi } from "@/lib/api-client";
import { DEMO_PORTAL_ENTRY, extractSubdomain } from "@/lib/portal-domain-utils";
import type { PortalDomainEntry } from "@/lib/portal-domain-utils";

const CACHE_TTL_MS = 30_000;

type CacheData = { domains: PortalDomainEntry[]; at: number };

declare global {
  // eslint-disable-next-line no-var
  var __portalDomainsCache: CacheData | undefined;
}

async function buildPortalDomains(): Promise<PortalDomainEntry[]> {
  const demo = [DEMO_PORTAL_ENTRY];

  const guilds = await dbApi.guilds.listAll().catch(() => null);
  if (!guilds) return demo;

  const entries = await Promise.all(
    guilds.map(async (guild): Promise<PortalDomainEntry | null> => {
      const config = await dbApi.panelConfig
        .get(String(guild.id))
        .catch(() => null);
      if (!config?.public_domain) return null;
      const sub = extractSubdomain(config.public_domain);
      if (!sub) return null;
      return {
        subdomain: sub,
        guildId: String(guild.id),
        snowflakeId: guild.snowflake_id,
        name: guild.name?.trim() || "Unnamed guild",
        isDemo: false,
      };
    }),
  );

  return [...demo, ...entries.filter((entry): entry is PortalDomainEntry => entry !== null)];
}

export async function getPortalDomains(): Promise<PortalDomainEntry[]> {
  const cached = globalThis.__portalDomainsCache;
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.domains;

  const domains = await buildPortalDomains();
  globalThis.__portalDomainsCache = { domains, at: Date.now() };
  return domains;
}

/** Drops the cached map so the next read rebuilds from the DB. */
export function invalidatePortalDomainsCache(): void {
  globalThis.__portalDomainsCache = undefined;
}

export async function findPortalBySubdomain(
  sub: string,
): Promise<PortalDomainEntry | undefined> {
  if (!sub) return undefined;
  const domains = await getPortalDomains();
  return domains.find((entry) => entry.subdomain === sub);
}

/**
 * Maps a public route id to the canonical id used by the data layer.
 * - `demo` (and the reserved `prbw` preview subdomain) stay on the demo portal.
 * - numeric values are existing snowflakes and pass through unchanged.
 * - anything else is treated as a subdomain and resolved to its snowflake.
 */
export async function resolvePublicGuildId(routeId: string): Promise<string> {
  const id = routeId.toLowerCase();
  if (id === "demo") return "demo";
  if (/^\d+$/.test(id)) return id;
  const entry = await findPortalBySubdomain(id);
  return entry ? entry.snowflakeId : id;
}