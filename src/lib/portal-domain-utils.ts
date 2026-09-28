/**
 * Shared (client-safe) helpers for guild portal subdomains.
 * No server-only imports here — the dashboard page and the API route both use
 * these to parse/validate a subdomain before saving it.
 */

export type PortalDomainEntry = {
  subdomain: string;
  guildId: string;
  snowflakeId: string;
  name: string;
  isDemo: boolean;
};

/**
 * Subdomains no guild may claim. `prbw` and `demo` belong to the built-in
 * preview portal; `www` is reserved for the apex host.
 */
export const RESERVED_SUBDOMAINS = ["www", "demo", "prbw"] as const;

export function isReservedSubdomain(sub: string): boolean {
  return (RESERVED_SUBDOMAINS as readonly string[]).includes(sub);
}

const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function isValidSubdomain(sub: string): boolean {
  return SUBDOMAIN_RE.test(sub);
}

/**
 * Parses the subdomain from a saved `public_domain` value (or the raw input).
 * Accepts `prbw.myrbw.dev`, `https://prbw.myrbw.dev/anything`, or a bare
 * `prbw`. Returns the first label when any FQDN is given.
 */
export function extractSubdomain(value: string): string | null {
  let v = value.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, "");
  v = v.split("/")[0];
  v = v.split(":")[0];
  if (!v) return null;
  const parts = v.split(".").filter(Boolean);
  const candidate = parts[0] ?? "";
  return isValidSubdomain(candidate) ? candidate : null;
}

/** The built-in preview portal (not registered in the DB). */
export const DEMO_PORTAL_ENTRY: PortalDomainEntry = {
  subdomain: "prbw",
  guildId: "demo",
  snowflakeId: "demo",
  name: "PRBW NETWORK",
  isDemo: true,
};