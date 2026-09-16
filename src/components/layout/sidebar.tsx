"use client";

import {
	AlertTriangle,
	Binary,
	Calculator,
	CalendarDays,
	ChevronDown,
	ChevronRight,
	Code2,
	Cpu,
	Database,
	Eye,
	FileCode,
	FileText,
	Flame,
	Gavel,
	Gift,
	GitBranch,
	Globe,
	Hammer,
	History,
	Image,
	Layers,
	LayoutDashboard,
	LifeBuoy,
	ListOrdered,
	Lock,
	LogOut,
	Mail,
	Map,
	PlusSquare,
	Radio,
	RefreshCw,
	Scale,
	ScrollText,
	Server,
	Settings2,
	Shield,
	SlidersHorizontal,
	Sparkles,
	Swords,
	Terminal,
	Ticket,
	UserCheck,
	Users,
	UsersRound,
	UserX,
	Webhook,
	Zap,
} from "lucide-react";

const DEVELOPER_USER_ID = "716417561008275497";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useUnsavedChangesContext } from "@/lib/contexts/changes-context";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";

// Page ID mapping for access control
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

function extractGuildId(pathname: string): string | null {
	const match = pathname.match(/\/dashboard\/([^\/]+)/);
	return match ? match[1] : null;
}

interface SessionInfo {
	userId: string;
	username: string;
	globalName: string | null;
	discriminator: string;
	avatar: string | null;
	avatarUrl: string;
}

interface NavItem {
	id: string;
	href: string;
	label: string;
	icon: any;
}

export function Sidebar() {
	const params = useParams();
	const pathname = usePathname();
	const router = useRouter();
	const guildId = params?.guildId as string | undefined;

	const { requestNavigation } = useUnsavedChangesContext();

	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [modulesExpanded, setModulesExpanded] = useState(true);
	const [session, setSession] = useState<SessionInfo | null>(null);
	const [accessiblePages, setAccessiblePages] = useState<Set<string>>(new Set());

	// Load session from API on mount
	useEffect(() => {
		fetch("/api/auth/session")
			.then((r) => r.json())
			.then((d) => { if (d.session) setSession(d.session); })
			.catch(() => {});
	}, []);

	// Load accessible pages based on developer config
	useEffect(() => {
		const loadAccessiblePages = async () => {
			if (!guildId || !session) return;

			// Developers have full access
			if (session.userId === DEVELOPER_USER_ID) {
				setAccessiblePages(new Set(Object.keys(PATH_TO_PAGE_ID)));
				return;
			}

			try {
				const response = await fetch(`/api/db/guilds/${guildId}/developer-config`);
				if (response.ok) {
					const data = await response.json();
					const devConfig: DeveloperConfig = data.data || { page_configs: [], category_configs: [] };

					// Calculate accessible pages
					const accessible = new Set<string>();
					
					devConfig.page_configs.forEach((page: PageConfig) => {
						if (page.is_enabled && !page.is_restricted) {
							// Check if category is enabled and not restricted
							if (page.category) {
								const category = devConfig.category_configs.find((c: CategoryConfig) => c.id === page.category);
								if (category && category.is_enabled && !category.is_restricted) {
									accessible.add(page.id);
								}
							} else {
								accessible.add(page.id);
							}
						}
					});

					setAccessiblePages(accessible);
				} else {
					// If we can't fetch config, allow all pages (fail-open)
					setAccessiblePages(new Set(Object.keys(PATH_TO_PAGE_ID)));
				}
			} catch (error) {
				console.error("[sidebar] Error loading accessible pages:", error);
				// Fail-open on errors
				setAccessiblePages(new Set(Object.keys(PATH_TO_PAGE_ID)));
			}
		};

		loadAccessiblePages();
	}, [guildId, session]);

	const [categoryStates, setCategoryStates] = useState<Record<string, boolean>>(
		{
			matchmaking: false,
			infrastructure: false,
			sanctions: false,
			moderation: false,
			tickets: false,
			toolkits: false,
			capabilities: false,
			simulations: false,
		},
	);

	const toggleCategory = (key: string) => {
		setCategoryStates((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const isActive = (path: string) => pathname === path;
	const baseHref = `/dashboard/${guildId ?? ""}`;

	/**
	 * Guarded navigation — checks for unsaved changes before navigating.
	 * If dirty, requestNavigation records the target and shows the guard dialog.
	 * If clean, navigates immediately.
	 */
	const guardedNavigate = (
		e: React.MouseEvent,
		href: string,
	) => {
		e.preventDefault();
		if (requestNavigation(href)) {
			router.push(href);
		}
	};

	// ================= SUB-SYSTEM REGISTRIES =================

	const coreNodes = [
		{
			id: "overview",
			href: `${baseHref}`,
			label: "Overview",
			icon: LayoutDashboard,
		},
		{
			id: "commands",
			href: `${baseHref}/infrastructure/commands`,
			label: "Commands",
			icon: Terminal,
		},
	];

	const matchmakingMatrix: NavItem[] = [
		{
			id: "queues",
			href: `${baseHref}/matchmaking/queues`,
			label: "Queue Systems",
			icon: ListOrdered,
		},
		{
			id: "players",
			href: `${baseHref}/matchmaking/players`,
			label: "Player Profiles",
			icon: Users,
		},
		{
			id: "matches",
			href: `${baseHref}/matchmaking/matches`,
			label: "Live Matches",
			icon: Swords,
		},
		{
			id: "ranks",
			href: `${baseHref}/matchmaking/ranks`,
			label: "Rank Thresholds",
			icon: UserCheck,
		},
		{
			id: "weights",
			href: `${baseHref}/matchmaking/weights`,
			label: "Stat Weighting",
			icon: Scale,
		},
		{
			id: "teams",
			href: `${baseHref}/matchmaking/team-formation`,
			label: "Team Generation",
			icon: UsersRound,
		},
		{
			id: "leaderboards",
			href: `${baseHref}/matchmaking/leaderboards`,
			label: "Global Leaderboards",
			icon: Flame,
		},
		{
			id: "parties",
			href: `${baseHref}/matchmaking/parties`,
			label: "Party Restraints",
			icon: SlidersHorizontal,
		},
	];

	const infrastructureNodes: NavItem[] = [
		{
			id: "hosting",
			href: `${baseHref}/infrastructure/hosting`,
			label: "Bot Nodes",
			icon: Server,
		},
		{
			id: "maps",
			href: `${baseHref}/infrastructure/maps`,
			label: "Map Registries",
			icon: Map,
		},
		{
			id: "seasons",
			href: `${baseHref}/infrastructure/seasons`,
			label: "Season Breaks",
			icon: CalendarDays,
		},
		{
			id: "proxies",
			href: `${baseHref}/infrastructure/auto-proxy`,
			label: "Instance Proxies",
			icon: Cpu,
		},
	];

	const moderationNodes: NavItem[] = [
		{
			id: "strike-logs",
			href: `${baseHref}/sanctions/strike-logs`,
			label: "Strike Records",
			icon: AlertTriangle,
		},
		{
			id: "strike-ladder",
			href: `${baseHref}/sanctions/strike-ladder`,
			label: "Strike Auto-Ladder",
			icon: History,
		},
		{
			id: "punish-logs",
			href: `${baseHref}/sanctions/punishment-logs`,
			label: "Punishment Logs",
			icon: Hammer,
		},
		{
			id: "punish-ladder",
			href: `${baseHref}/sanctions/punishment-ladder`,
			label: "Enforcement Rules",
			icon: Gavel,
		},
		{
			id: "anticheat",
			href: `${baseHref}/sanctions/anticheat`,
			label: "Anti-Cheat Matrix",
			icon: Binary,
		},
		{
			id: "settings-access",
			href: `${baseHref}/moderation/settings-access`,
			label: "Settings Access Control",
			icon: Shield,
		},
	];

	const ticketNodes: NavItem[] = [
		{
			id: "tickets-live",
			href: `${baseHref}/tickets/active`,
			label: "Live Support Hub",
			icon: Ticket,
		},
		{
			id: "tickets-arch",
			href: `${baseHref}/tickets/transcripts`,
			label: "Archived Logs",
			icon: FileText,
		},
		{
			id: "tickets-claim",
			href: `${baseHref}/tickets/claims`,
			label: "Staff Routing",
			icon: UsersRound,
		},
		{
			id: "tickets-black",
			href: `${baseHref}/tickets/blacklist`,
			label: "Support Blacklist",
			icon: UserX,
		},
		{
			id: "tickets-drop",
			href: `${baseHref}/tickets/panel-creator`,
			label: "Drop Embed Panels",
			icon: PlusSquare,
		},
	];

	const creatorTools: NavItem[] = [
		{
			id: "banners",
			href: `${baseHref}/toolkits/banner-builder`,
			label: "Banner Builder",
			icon: Image,
		},
		{
			id: "brackets",
			href: `${baseHref}/toolkits/bracket-builder`,
			label: "Bracket Builder",
			icon: GitBranch,
		},
		{
			id: "webhooks",
			href: `${baseHref}/toolkits/webhook-builder`,
			label: "Webhook Builder",
			icon: Webhook,
		},
		{
			id: "embeds",
			href: `${baseHref}/toolkits/embeds`,
			label: "Embed Studio",
			icon: Code2,
		},
		{
			id: "panels",
			href: `${baseHref}/toolkits/panel-deployer`,
			label: "Panel Deployer",
			icon: FileCode,
		},
	];

	const platformFeatures: NavItem[] = [
		{
			id: "perks",
			href: `${baseHref}/capabilities/perks`,
			label: "Tier Perks",
			icon: Sparkles,
		},
		{
			id: "giveaways",
			href: `${baseHref}/capabilities/giveaways`,
			label: "Giveaways Engine",
			icon: Gift,
		},
		{
			id: "reaction-roles",
			href: `${baseHref}/capabilities/reaction-roles`,
			label: "Reaction Roles",
			icon: Radio,
		},
		{
			id: "loggers",
			href: `${baseHref}/capabilities/loggers`,
			label: "Event Loggers",
			icon: ScrollText,
		},
		{
			id: "streaks",
			href: `${baseHref}/capabilities/streaks`,
			label: "Daily Streaks",
			icon: Zap,
		},
	];

	const simulationNodes: NavItem[] = [
		{
			id: "sim-elo",
			href: `${baseHref}/simulators/elo`,
			label: "ELO Projection",
			icon: Calculator,
		},
		{
			id: "sim-prog",
			href: `${baseHref}/simulators/progression`,
			label: "Rank Progression",
			icon: Calculator,
		},
		{
			id: "sim-party",
			href: `${baseHref}/simulators/party`,
			label: "Party Balancing",
			icon: Calculator,
		},
		{
			id: "sim-queue",
			href: `${baseHref}/simulators/queue`,
			label: "Queue Math",
			icon: Calculator,
		},
		{
			id: "sim-capt",
			href: `${baseHref}/simulators/captain`,
			label: "Captain Pick",
			icon: Calculator,
		},
		{
			id: "sim-strike",
			href: `${baseHref}/simulators/strike-preview`,
			label: "Strike Preview",
			icon: Calculator,
		},
	];

	const systemControls = [
		{
			id: "domain",
			href: `${baseHref}/networking/public-domain`,
			label: "Portal Domain",
			icon: Globe,
		},
		{
			id: "audit",
			href: `${baseHref}/networking/audit-logs`,
			label: "Audit Tracing",
			icon: Eye,
		},
		{
			id: "backups",
			href: `${baseHref}/networking/backups`,
			label: "Backup & Restore",
			icon: Database,
		},
		{
			id: "developer",
			href: `${baseHref}/developer`,
			label: "Developer Console",
			icon: Shield,
		},
		{
			id: "contact",
			href: `${baseHref}/networking/contact`,
			label: "Core Contact",
			icon: Mail,
		},
	];

	const allModuleItems = [
		...matchmakingMatrix,
		...infrastructureNodes,
		...moderationNodes,
		...ticketNodes,
		...creatorTools,
		...platformFeatures,
		...simulationNodes,
	];

	// Filter system controls based on developer access
	const filteredSystemControls = systemControls.filter(control => {
		if (control.id === "developer") {
			return session?.userId === DEVELOPER_USER_ID;
		}
		return true;
	});

	// HIGH-FIDELITY LINK RENDERER WITH SEMANTIC COLOR ACCENTS
	// Uses guarded <a> instead of <Link> so navigation can be intercepted when dirty.
	const renderLink = (
		item: NavItem,
		colorClass = "text-fg-muted/70",
	) => {
		const Icon = item.icon;
		const active = isActive(item.href);
		
		// Check if page is accessible
		const pattern = item.href.replace(guildId || "", "[guildId]");
		const pageId = PATH_TO_PAGE_ID[pattern];
		const isAccessible = session?.userId === DEVELOPER_USER_ID || accessiblePages.has(pageId || "");


			// Keep unavailable pages visible so everyone can understand what is locked.
			// Developers retain normal navigation access to inspect the locked surface.
			return (
			<a
					key={item.href}
					data-tour={item.id === "commands" ? "commands-nav" : undefined}
					href={item.href}
					onClick={(e) => {
						if (!isAccessible) { e.preventDefault(); return; }
						guardedNavigate(e, item.href);
					}}
					className={`group/link flex items-center gap-2.5 px-3 py-2 rounded-lg font-mono text-[12px] font-bold uppercase tracking-wider transition-all active:scale-98 ${isAccessible ? "cursor-pointer" : "cursor-not-allowed"} ${
					active
						? "bg-primary-500/10 text-primary-500 border border-primary-500/20 shadow-sm"
						: "text-fg-muted hover:text-fg-default hover:bg-panel-bg/40 border border-transparent"
				} ${!isAccessible ? "opacity-60" : ""}`}
			>
				<Icon
					className={`size-4 shrink-0 ${active ? "text-primary-500" : colorClass}`}
				/>
				<span className="truncate">{item.label}</span>
					{!isAccessible && (
						<Lock className="ml-auto size-3.5 shrink-0 text-amber-500" aria-label="Locked" />
					)}
			</a>
		);
	};

	const renderDropdownTrigger = (
		label: string,
		icon: any,
		isOpen: boolean,
		onToggle: () => void,
		isSubCategory = false,
		colorClass = "text-primary-500",
	) => {
		const Icon = icon;
		return (
			<button
				onClick={onToggle}
				className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-mono font-bold uppercase tracking-wider transition-all active:scale-98 border border-transparent ${
					isSubCategory
						? "text-fg-muted/70 hover:text-fg-default hover:bg-panel-bg/20 text-[11px]"
						: "text-fg-muted hover:text-fg-default hover:bg-panel-bg/40 text-[12px]"
				}`}
			>
				<div className="flex items-center gap-2.5">
					<Icon className={`size-4 ${colorClass}`} />
					<span>{label}</span>
				</div>
				{isOpen ? (
					<ChevronDown className="size-3.5 text-fg-muted/60 shrink-0" />
				) : (
					<ChevronRight className="size-3.5 text-fg-muted/60 shrink-0" />
				)}
			</button>
		);
	};

	const handleLogout = async () => {
		setIsLoggingOut(true);
		try {
			await fetch("/api/auth/logout", { method: "POST" });
		} catch {
			// ignore
		}
		router.push("/");
	};

	return (
		<aside data-tour="sidebar" className="hidden lg:flex w-64 flex-col border-r border-border-subtle bg-panel-bg/40 backdrop-blur-md transition-colors duration-300 relative z-10 select-none">
			{isLoggingOut && (
				<div className="absolute inset-0 bg-bg-canvas/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-3">
					<RefreshCw className="size-5 text-red-500 animate-spin" />
					<p className="font-mono text-[9px] tracking-widest text-red-400 uppercase">
						// Ending Session...
					</p>
				</div>
			)}

			<div className="flex h-14 items-center border-b border-border-subtle px-4 shrink-0">
				{/* Logo — guarded navigation */}
				<a
					href="/"
					onClick={(e) => guardedNavigate(e, "/")}
					className="flex items-center gap-2 font-bold hover:opacity-90 transition-all active:scale-98 cursor-pointer"
				>
					<span className="flex items-center justify-center size-7 rounded-md bg-primary-50 text-primary-500 shadow-sm border border-border-subtle">
						<Swords className="size-4" />
					</span>
					<span className="font-display font-bold text-base tracking-tight text-fg-default">
						myrbw.dev
					</span>
				</a>
			</div>

			<div className="p-4 border-b border-border-subtle bg-bg-canvas/20 flex flex-col gap-3 shrink-0">
				<div className="flex items-center gap-3">
					<div className="relative size-10 shrink-0 rounded-md overflow-hidden bg-muted border border-border-subtle">
						<img
							src={session?.avatarUrl ?? "https://cdn.discordapp.com/embed/avatars/0.png"}
							alt="Avatar"
							className="size-full object-cover"
						/>
						<div className="absolute bottom-0 right-0 size-2.5 bg-success rounded-full border border-bg-canvas" />
					</div>
					<div className="flex-1 min-w-0 text-left">
						<div className="font-mono text-sm font-bold text-fg-default truncate uppercase tracking-wide">
							{session ? (session.globalName ?? session.username) : "Loading..."}
						</div>
						<div className="font-mono text-[11px] font-bold text-success uppercase tracking-widest mt-0.5">
							{session ? "Session Active" : "Connecting..."}
						</div>
					</div>
				</div>
				<div className="grid grid-cols-5 gap-2 pt-1">
					{/* Switch Node — guarded */}
					<button
						onClick={(e) => guardedNavigate(e, "/setup")}
						className="col-span-4 h-9 flex items-center justify-center gap-1.5 border border-border-subtle hover:border-primary-500/40 bg-panel-bg/40 hover:bg-panel-bg text-fg-default font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm"
					>
						<RefreshCw className="size-3.5 text-fg-muted" /> Switch Node
					</button>
					<button
						onClick={handleLogout}
						title="Disconnect Session"
						className="col-span-1 h-9 flex items-center justify-center border border-border-subtle hover:border-red-500/40 hover:bg-red-500/10 text-fg-muted hover:text-red-500 rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm"
					>
						<LogOut className="size-4" />
					</button>
				</div>
			</div>

			<nav className="flex-1 overflow-y-auto p-3 space-y-1.5 pb-32 scrollbar-thin">
				{guildId ? (
					<>
						{/* Core Top Navigation Strip (Muted Slate Icons) */}
						<div className="space-y-0.5">
							{coreNodes.map((node) =>
								renderLink(node, "text-fg-muted/60"),
							)}
						</div>

						<div className="space-y-0.5">
							{renderDropdownTrigger(
								"Modules Matrix",
								Layers,
								modulesExpanded,
								() => setModulesExpanded(!modulesExpanded),
								false,
								"text-primary-500",
							)}
							{modulesExpanded && (
								<div className="pl-2 ml-1 border-l border-border-subtle/50 space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
									{/* ⚔️ MATCHMAKING MATRIX (Violet / Purple Accent Vector) */}
									<div className="space-y-0.5">
										{renderDropdownTrigger(
											"Matchmaking",
											ListOrdered,
											categoryStates.matchmaking,
											() => toggleCategory("matchmaking"),
											true,
											"text-violet-500",
										)}
										{categoryStates.matchmaking && (
											<div className="space-y-0.5 pl-2 animate-in fade-in duration-100">
												{matchmakingMatrix.map((item) =>
													renderLink(item, "text-violet-500/60"),
												)}
											</div>
										)}
									</div>

									{/* 🌐 INFRASTRUCTURE NODES (Cyan / Light Blue Accent Vector) */}
									<div className="space-y-0.5">
										{renderDropdownTrigger(
											"Infrastructure",
											Server,
											categoryStates.infrastructure,
											() => toggleCategory("infrastructure"),
											true,
											"text-cyan-500",
										)}
										{categoryStates.infrastructure && (
											<div className="space-y-0.5 pl-2 animate-in fade-in duration-100">
												{infrastructureNodes.map((item) =>
													renderLink(item, "text-cyan-500/60"),
												)}
											</div>
										)}
									</div>

									{/* 🛡️ SANCTIONS & SECURITY (Rose / Red Accent Vector) */}
									<div className="space-y-0.5">
										{renderDropdownTrigger(
											"Sanctions & Security",
											Shield,
											categoryStates.moderation,
											() => toggleCategory("moderation"),
											true,
											"text-rose-500",
										)}
										{categoryStates.moderation && (
											<div className="space-y-0.5 pl-2 animate-in fade-in duration-100">
												{moderationNodes.map((item) =>
													renderLink(item, "text-rose-500/60"),
												)}
											</div>
										)}
									</div>

									{/* 🎫 TICKET SUBSYSTEM (Orange / Bronze Accent Vector) */}
									<div className="space-y-0.5">
										{renderDropdownTrigger(
											"Ticket Subsystem",
											LifeBuoy,
											categoryStates.tickets,
											() => toggleCategory("tickets"),
											true,
											"text-orange-500",
										)}
										{categoryStates.tickets && (
											<div className="space-y-0.5 pl-2 animate-in fade-in duration-100">
												{ticketNodes.map((item) =>
													renderLink(item, "text-orange-500/60"),
												)}
											</div>
										)}
									</div>

									{/* 🎨 CREATOR TOOLKITS (Emerald / Green Accent Vector) */}
									<div className="space-y-0.5">
										{renderDropdownTrigger(
											"Creator Toolkits",
											Image,
											categoryStates.toolkits,
											() => toggleCategory("toolkits"),
											true,
											"text-emerald-500",
										)}
										{categoryStates.toolkits && (
											<div className="space-y-0.5 pl-2 animate-in fade-in duration-100">
												{creatorTools.map((item) =>
													renderLink(item, "text-emerald-500/60"),
												)}
											</div>
										)}
									</div>

									{/* ⚡ CAPABILITIES ENGINE (Indigo / Deep Blue Accent Vector) */}
									<div className="space-y-0.5">
										{renderDropdownTrigger(
											"Capabilities",
											Sparkles,
											categoryStates.capabilities,
											() => toggleCategory("capabilities"),
											true,
											"text-indigo-500",
										)}
										{categoryStates.capabilities && (
											<div className="space-y-0.5 pl-2 animate-in fade-in duration-100">
												{platformFeatures.map((item) =>
													renderLink(item, "text-indigo-500/60"),
												)}
											</div>
										)}
									</div>

									{/* 📊 SIMULATION MODELS (Sky Blue Accent Vector) */}
									<div className="space-y-0.5">
										{renderDropdownTrigger(
											"Simulation Models",
											Calculator,
											categoryStates.simulations,
											() => toggleCategory("simulations"),
											true,
											"text-sky-500",
										)}
										{categoryStates.simulations && (
											<div className="space-y-0.5 pl-2 animate-in fade-in duration-100">
												{simulationNodes.map((item) =>
													renderLink(item, "text-sky-500/60"),
												)}
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Base Controls Strip Footer Layer (Neutral Muted Gray Icons) */}
							<div className="space-y-0.5 pt-2 border-t border-border-subtle/30">
								{filteredSystemControls.map((node) =>
									renderLink(node, "text-fg-muted/60"),
								)}
							</div>
							<ThemeSwitcher />
					</>
				) : (
					<div className="p-4 border border-dashed border-border-subtle/50 rounded-xl text-center">
						<p className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
							Missing Target Node
						</p>
					</div>
				)}
			</nav>
		</aside>
	);
}
