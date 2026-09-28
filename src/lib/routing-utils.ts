/**
 * Routing utilities for handling subdomain vs main domain navigation
 */

import { PUBLIC_PORTAL_ROOT_DOMAIN } from "./config-public-url";

/**
 * Normalise a host for comparison: lowercase, drop any port, drop a leading
 * "www.", and drop leading dots.
 *
 * "www" is treated as an alias of the apex rather than as a guild, because that
 * is how the apex is actually served: on www.myrbw.dev the guild belongs in the
 * path (/dashboard/<guildId>), not in the hostname.
 */
function normalizeHost(host: string): string {
	return host
		.trim()
		.toLowerCase()
		.replace(/:\d+$/, "") // strip port
		.replace(/^www\./, "") // www. is the apex, not a guild
		.replace(/^\.+/, "");
}

/**
 * Check if the current request is on a guild subdomain
 * @param host - The current host (e.g., "test.myrbw.dev" or "localhost")
 * @returns true if on a guild subdomain, false otherwise
 */
export function isSubdomain(host: string): boolean {
	const rootDomain = normalizeHost(PUBLIC_PORTAL_ROOT_DOMAIN);
	const normalizedHost = normalizeHost(host);

	if (!rootDomain || !normalizedHost) return false;
	if (normalizedHost === "localhost" || normalizedHost === "127.0.0.1") return false;

	// Require a label boundary so "notmyrbw.dev" and "myrbw.dev.attacker.com"
	// are both rejected. A bare substring test accepted both.
	return normalizedHost.endsWith(`.${rootDomain}`);
}

/**
 * Get the appropriate dashboard path based on current domain context
 * @param guildId - The Discord guild ID
 * @param path - The dashboard path (e.g., "/dashboard" or "/dashboard/networking/public-domain")
 * @returns The appropriate path for the current context
 */
export function getDashboardPath(guildId: string, path: string = "/dashboard"): string {
	if (typeof window === "undefined") {
		// Server-side: include guild ID in path
		return path.replace(/^\/dashboard/, `/dashboard/${guildId}`);
	}

	const host = window.location.host;
	if (isSubdomain(host)) {
		// On subdomain: use clean URL without guild ID
		// Remove /dashboard/{guildId} pattern and replace with /dashboard
		return path.replace(/^\/dashboard\/[^\/]+/, "/dashboard");
	} else {
		// On main domain: include guild ID in path
		return path.replace(/^\/dashboard/, `/dashboard/${guildId}`);
	}
}

/**
 * Navigate to the appropriate dashboard path based on current domain context
 * @param router - Next.js router
 * @param guildId - The Discord guild ID
 * @param path - The dashboard path (e.g., "/dashboard" or "/dashboard/networking/public-domain")
 */
export function navigateToDashboard(
	router: any,
	guildId: string,
	path: string = "/dashboard"
): void {
	const targetPath = getDashboardPath(guildId, path);
	router.push(targetPath);
}