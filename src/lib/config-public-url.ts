/**
 * Root domain used for guild portal subdomains (e.g. prbw.{root}).
 * Override at deploy time with NEXT_PUBLIC_PORTAL_ROOT_DOMAIN if the platform
 * is hosted on a different apex domain.
 */
export const PUBLIC_PORTAL_ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_PORTAL_ROOT_DOMAIN ?? "myrbw.dev";