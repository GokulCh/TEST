"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Lock, AlertTriangle } from "lucide-react";

const DEVELOPER_USER_ID = "716417561008275497";

// Path to page ID mapping
const PATH_TO_PAGE_ID: Record<string, string> = {
	"/dashboard/[guildId]": "overview",
	"/dashboard/[guildId]/infrastructure/commands": "commands",
	"/dashboard/[guildId]/matchmaking/queues": "queues",
	"/dashboard/[guildId]/matchmaking/players": "players",
	"/dashboard/[guildId]/matchmaking/matches": "matches",
	"/dashboard/[guildId]/matchmaking/ranks": "ranks",
	"/dashboard/[guildId]/matchmaking/weights": "weights",
	"/dashboard/[guildId]/matchmaking/team-formation": "teams",
	"/dashboard/[guildId]/matchmaking/leaderboards": "leaderboards",
	"/dashboard/[guildId]/matchmaking/parties": "parties",
	"/dashboard/[guildId]/infrastructure/hosting": "hosting",
	"/dashboard/[guildId]/infrastructure/maps": "maps",
	"/dashboard/[guildId]/infrastructure/seasons": "seasons",
	"/dashboard/[guildId]/infrastructure/auto-proxy": "proxies",
	"/dashboard/[guildId]/sanctions/strike-logs": "strike-logs",
	"/dashboard/[guildId]/sanctions/strike-ladder": "strike-ladder",
	"/dashboard/[guildId]/sanctions/punishment-logs": "punish-logs",
	"/dashboard/[guildId]/sanctions/punishment-ladder": "punish-ladder",
	"/dashboard/[guildId]/sanctions/anticheat": "anticheat",
	"/dashboard/[guildId]/moderation/settings-access": "settings-access",
	"/dashboard/[guildId]/tickets/active": "tickets-live",
	"/dashboard/[guildId]/tickets/transcripts": "tickets-arch",
	"/dashboard/[guildId]/tickets/claims": "tickets-claim",
	"/dashboard/[guildId]/tickets/blacklist": "tickets-black",
	"/dashboard/[guildId]/tickets/panel-creator": "tickets-drop",
	"/dashboard/[guildId]/toolkits/banner-builder": "banners",
	"/dashboard/[guildId]/toolkits/bracket-builder": "brackets",
	"/dashboard/[guildId]/toolkits/webhook-builder": "webhooks",
	"/dashboard/[guildId]/toolkits/embeds": "embeds",
	"/dashboard/[guildId]/toolkits/panel-deployer": "panels",
	"/dashboard/[guildId]/capabilities/perks": "perks",
	"/dashboard/[guildId]/capabilities/giveaways": "giveaways",
	"/dashboard/[guildId]/capabilities/reaction-roles": "reaction-roles",
	"/dashboard/[guildId]/capabilities/loggers": "loggers",
	"/dashboard/[guildId]/capabilities/streaks": "streaks",
	"/dashboard/[guildId]/simulators/elo": "sim-elo",
	"/dashboard/[guildId]/simulators/progression": "sim-prog",
	"/dashboard/[guildId]/simulators/party": "sim-party",
	"/dashboard/[guildId]/simulators/queue": "sim-queue",
	"/dashboard/[guildId]/simulators/captain": "sim-capt",
	"/dashboard/[guildId]/simulators/strike-preview": "sim-strike",
	"/dashboard/[guildId]/networking/public-domain": "domain",
	"/dashboard/[guildId]/networking/audit-logs": "audit",
	"/dashboard/[guildId]/networking/backups": "backups",
	"/dashboard/[guildId]/developer": "developer",
	"/dashboard/[guildId]/networking/contact": "contact",
};

interface PageConfig {
	id: string;
	name: string;
	path: string;
	is_enabled: boolean;
	is_restricted: boolean;
	category?: string;
}

interface CategoryConfig {
	id: string;
	name: string;
	is_enabled: boolean;
	is_restricted: boolean;
	pages: string[];
}

interface DeveloperConfig {
	page_configs: PageConfig[];
	category_configs: CategoryConfig[];
}

interface SessionInfo {
	userId: string;
	username: string;
	globalName: string | null;
	discriminator: string;
	avatar: string | null;
	avatarUrl: string;
}

// Convert actual pathname to pattern for lookup
function pathnameToPattern(pathname: string): string {
	return pathname.replace(/\/dashboard\/[^\/]+/, "/dashboard/[guildId]");
}

function extractGuildId(pathname: string): string | null {
	const match = pathname.match(/\/dashboard\/([^\/]+)/);
	return match ? match[1] : null;
}

async function checkPageAccess(pathname: string, guildId: string): Promise<{ allowed: boolean; reason?: string }> {
	try {
		const sessionRes = await fetch("/api/auth/session");
		const sessionData = await sessionRes.json();
		const session: SessionInfo | null = sessionData.session || null;

		if (!session) {
			return { allowed: false, reason: "No session" };
		}

		// Check if user is developer (developers have full access)
		if (session.userId === DEVELOPER_USER_ID) {
			return { allowed: true };
		}

		// Fetch developer config for this guild
		const response = await fetch(`/api/db/guilds/${guildId}/developer-config`);
		if (!response.ok) {
			// If we can't fetch config, allow access (fail-open for normal operation)
			return { allowed: true };
		}

		const data = await response.json();
		const devConfig: DeveloperConfig = data.data || { page_configs: [], category_configs: [] };

		// Convert pathname to pattern and get page ID
		const pattern = pathnameToPattern(pathname);
		const pageId = PATH_TO_PAGE_ID[pattern];

		if (!pageId) {
			// Unknown page, allow access
			return { allowed: true };
		}

		// Find page config
		const pageConfig = devConfig.page_configs.find(p => p.id === pageId);
		
		if (!pageConfig) {
			// Page not in config, allow access
			return { allowed: true };
		}

		// Check if page is enabled
		if (!pageConfig.is_enabled) {
			return { allowed: false, reason: "Page disabled" };
		}

		// Check if page is restricted (developer only)
		if (pageConfig.is_restricted) {
			return { allowed: false, reason: "Page restricted to developers" };
		}

		// Check if category is enabled and not restricted
		if (pageConfig.category) {
			const categoryConfig = devConfig.category_configs.find(c => c.id === pageConfig.category);
			if (categoryConfig) {
				if (!categoryConfig.is_enabled) {
					return { allowed: false, reason: "Category disabled" };
				}
				if (categoryConfig.is_restricted) {
					return { allowed: false, reason: "Category restricted to developers" };
				}
			}
		}

		return { allowed: true };
	} catch (error) {
		console.error("[page-access-guard] Error checking page access:", error);
		// Fail-open on errors to prevent breaking normal operation
		return { allowed: true };
	}
}

export function PageAccessGuard({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const [accessCheck, setAccessCheck] = useState<{ allowed: boolean; reason?: string } | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAccess = async () => {
			const guildId = extractGuildId(pathname);
			if (!guildId) {
				setAccessCheck({ allowed: true });
				setIsLoading(false);
				return;
			}

			const result = await checkPageAccess(pathname, guildId);
			setAccessCheck(result);
			setIsLoading(false);

				// Keep the locked state visible on the requested route so the restriction is
				// clear instead of silently sending users somewhere else.

		};

		checkAccess();
		}, [pathname]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin size-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full" />
			</div>
		);
	}

	if (!accessCheck?.allowed) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center space-y-4 max-w-md">
					<Lock className="size-12 text-fg-muted mx-auto" />
					<div>
						<h3 className="font-mono text-sm font-bold text-fg-default uppercase tracking-wider">
							Access Restricted
						</h3>
						<p className="font-mono text-xs text-fg-muted mt-2">
							{accessCheck.reason || "This page is not currently accessible."}
						</p>
					</div>
					<div className="flex items-center justify-center gap-2 text-fg-muted/60">
						<AlertTriangle className="size-4" />
						<p className="font-mono text-[9px] uppercase tracking-wider">
							Redirecting to overview...
						</p>
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
