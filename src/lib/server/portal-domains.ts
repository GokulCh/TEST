/**
 * Server-only registry of guild portal subdomains.
 *
 * A guild's subdomain is its `public_domain` config field, so the API resolves
 * one subdomain at a time (GET /v1/guilds?public_domain=) rather than listing
 * them all. This module wraps that lookup so that:
 *   - `prbw.myrbw.dev` resolves to the built-in preview portal, and
 *   - a subdomain a guild registers (e.g. `jartex.myrbw.dev`) resolves to that
 *     guild's real portal data.
 *
 * Lookups, including misses, are cached briefly to avoid a DB call on every
 * public page render. This module touches the DB API and must only be imported
 * from server code.
 */

import { ApiError, dbApi } from "@/lib/server/api-client";
import { DEMO_PORTAL_ENTRY } from "@/lib/portal-domain-utils";
import type { PortalDomainEntry } from "@/lib/portal-domain-utils";

const CACHE_TTL_MS = 30_000;

type CacheEntry = { entry: PortalDomainEntry | undefined; at: number };

declare global {
  // eslint-disable-next-line no-var
  var __portalDomainsCache: Map<string, CacheEntry> | undefined;
}

const cache = () => (globalThis.__portalDomainsCache ??= new Map());

/** Drops every cached lookup so the next read asks the DB again. */
export function invalidatePortalDomainsCache(): void {
  globalThis.__portalDomainsCache = undefined;
}

export async function findPortalBySubdomain(
  sub: string,
): Promise<PortalDomainEntry | undefined> {
  if (!sub) return undefined;
  if (sub === DEMO_PORTAL_ENTRY.subdomain) return DEMO_PORTAL_ENTRY;

  const hit = cache().get(sub);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.entry;

  let entry: PortalDomainEntry | undefined;
  try {
    const guild = await dbApi.guilds.getByPublicDomain(sub);
    entry = {
      subdomain: sub,
      guildId: String(guild.id),
      snowflakeId: guild.snowflake_id,
      name: guild.name?.trim() || "Unnamed guild",
      isDemo: false,
    };
  } catch (err) {
    // A 404 is a real answer (nobody owns it); anything else is not cached.
    if (!(err instanceof ApiError && err.isNotFound)) {
      console.error("[findPortalBySubdomain] Failed to resolve subdomain:", err);
      return undefined;
    }
  }
  cache().set(sub, { entry, at: Date.now() });
  return entry;
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