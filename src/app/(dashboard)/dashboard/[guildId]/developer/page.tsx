"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Clock,
	Code,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Pencil,
	Plus,
	Save,
	Shield,
	Trash2,
	ToggleLeft,
	ToggleRight,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useTabGuard } from "@/hooks/use-tab-guard";

const DEVELOPER_USER_ID = "716417561008275497";

interface DevUpdateLog {
	id: string;
	title: string;
	content: string;
	version: string;
	date: string;
	is_featured: boolean;
}

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

export default function Page() {
	const { dbGuildId } = useGuildConfig();
	
	const [currentUser, setCurrentUser] = useState<string | null>(null);
	const [isDeveloper, setIsDeveloper] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [dbConfigured, setDbConfigured] = useState(true);

	// Developer configuration state
	const [updateLogs, setUpdateLogs] = useState<DevUpdateLog[]>([]);
	const [pageConfigs, setPageConfigs] = useState<PageConfig[]>([]);
	const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>([]);
	const [activeTab, setActiveTab] = useState<"logs" | "navigation" | "access">("logs");
	const [navigationQuery, setNavigationQuery] = useState("");
	const [isPreviewMode, setIsPreviewMode] = useState(false);

	const TAB_LABELS = {
		logs: "Update Logs",
			navigation: "Navigation Control",
		access: "Access Control",
	} as const;

	// Track saved state for unsaved changes detection
	const [savedUpdateLogs, setSavedUpdateLogs] = useState<DevUpdateLog[]>([]);
	const [savedPageConfigs, setSavedPageConfigs] = useState<PageConfig[]>([]);
	const [savedCategoryConfigs, setSavedCategoryConfigs] = useState<CategoryConfig[]>([]);

	// ── Global unsaved changes (drives SaveBar + nav guard) ───────────────
	const globalLocal = useMemo(() => ({
		updateLogs, pageConfigs, categoryConfigs,
	}), [updateLogs, pageConfigs, categoryConfigs]);

	const globalSaved = useMemo(() => ({
		updateLogs: savedUpdateLogs,
		pageConfigs: savedPageConfigs,
		categoryConfigs: savedCategoryConfigs,
	}), [savedUpdateLogs, savedPageConfigs, savedCategoryConfigs]);

	const { isDirty } = useUnsavedChanges(globalLocal, globalSaved);

	// ── Per-tab snapshots for tab guard ──────────────────────────────────
	const savedLogs = useMemo(() => savedUpdateLogs, [savedUpdateLogs]);
	const savedPages = useMemo(() => savedPageConfigs, [savedPageConfigs]);
	const savedCategories = useMemo(() => savedCategoryConfigs, [savedCategoryConfigs]);

	const localLogs = useMemo(() => updateLogs, [updateLogs]);
	const localPages = useMemo(() => pageConfigs, [pageConfigs]);
	const localCategories = useMemo(() => categoryConfigs, [categoryConfigs]);

	// ── Tab guard ─────────────────────────────────────────────────────────
	const handleDiscard = useCallback((discardedTab: typeof activeTab) => {
		if (discardedTab === "logs") {
			setUpdateLogs([...savedLogs]);
			} else if (discardedTab === "navigation") {
				setPageConfigs([...savedPages]);
				setCategoryConfigs([...savedCategories]);
		}
	}, [savedLogs, savedPages, savedCategories]);

	const tabGuard = useTabGuard<typeof activeTab>({
		activeTab,
		setActiveTab,
		tabSnapshots: {
			logs:       { local: localLogs,       saved: savedLogs },
				navigation: { local: { pages: localPages, categories: localCategories }, saved: { pages: savedPages, categories: savedCategories } },
				access:     { local: null,            saved: null },
		},
		onDiscard: handleDiscard,
	});

	// Form state for new logs
	const [newLog, setNewLog] = useState({
		title: "",
		content: "",
		version: "",
		is_featured: false,
	});

	// Check if current user is developer
	useEffect(() => {
		const checkDeveloperAccess = async () => {
			try {
				const res = await fetch("/api/auth/session");
				const data = await res.json();
				if (data.session && data.session.userId) {
					setCurrentUser(data.session.userId);
					setIsDeveloper(data.session.userId === DEVELOPER_USER_ID);
				} else {
					setCurrentUser(null);
					setIsDeveloper(false);
				}
			} catch (error) {
				console.error("Failed to check developer access:", error);
				setCurrentUser(null);
				setIsDeveloper(false);
			} finally {
				setIsLoading(false);
			}
		};

		checkDeveloperAccess();
	}, []);

	// Initialize default page and category configs based on navigation structure
	useEffect(() => {
		if (!isDeveloper) return;

		// Default pages from navigation
		const defaultPages: PageConfig[] = [
			// Core
			{ id: "overview", name: "Overview", path: "/dashboard/[guildId]", is_enabled: true, is_restricted: false, category: "core" },
			{ id: "commands", name: "Custom Commands", path: "/dashboard/[guildId]/infrastructure/commands", is_enabled: true, is_restricted: false, category: "core" },
			// Matchmaking
			{ id: "queues", name: "Queue Systems", path: "/dashboard/[guildId]/matchmaking/queues", is_enabled: true, is_restricted: false, category: "matchmaking" },
			{ id: "players", name: "Player Profiles", path: "/dashboard/[guildId]/matchmaking/players", is_enabled: true, is_restricted: false, category: "matchmaking" },
			{ id: "matches", name: "Live Matches", path: "/dashboard/[guildId]/matchmaking/matches", is_enabled: true, is_restricted: false, category: "matchmaking" },
			{ id: "ranks", name: "Rank Thresholds", path: "/dashboard/[guildId]/matchmaking/ranks", is_enabled: true, is_restricted: false, category: "matchmaking" },
			{ id: "weights", name: "Stat Weighting", path: "/dashboard/[guildId]/matchmaking/weights", is_enabled: true, is_restricted: false, category: "matchmaking" },
			{ id: "teams", name: "Team Generation", path: "/dashboard/[guildId]/matchmaking/team-formation", is_enabled: true, is_restricted: false, category: "matchmaking" },
			{ id: "leaderboards", name: "Global Leaderboards", path: "/dashboard/[guildId]/matchmaking/leaderboards", is_enabled: true, is_restricted: false, category: "matchmaking" },
			{ id: "parties", name: "Party Restraints", path: "/dashboard/[guildId]/matchmaking/parties", is_enabled: true, is_restricted: false, category: "matchmaking" },
			// Infrastructure
			{ id: "hosting", name: "Bot Nodes", path: "/dashboard/[guildId]/infrastructure/hosting", is_enabled: true, is_restricted: false, category: "infrastructure" },
			{ id: "maps", name: "Map Registries", path: "/dashboard/[guildId]/infrastructure/maps", is_enabled: true, is_restricted: false, category: "infrastructure" },
			{ id: "seasons", name: "Season Breaks", path: "/dashboard/[guildId]/infrastructure/seasons", is_enabled: true, is_restricted: false, category: "infrastructure" },
			{ id: "proxies", name: "Instance Proxies", path: "/dashboard/[guildId]/infrastructure/auto-proxy", is_enabled: true, is_restricted: false, category: "infrastructure" },
			// Moderation
			{ id: "strike-logs", name: "Strike Records", path: "/dashboard/[guildId]/sanctions/strike-logs", is_enabled: true, is_restricted: false, category: "moderation" },
			{ id: "strike-ladder", name: "Strike Auto-Ladder", path: "/dashboard/[guildId]/sanctions/strike-ladder", is_enabled: true, is_restricted: false, category: "moderation" },
			{ id: "punish-logs", name: "Punishment Logs", path: "/dashboard/[guildId]/sanctions/punishment-logs", is_enabled: true, is_restricted: false, category: "moderation" },
			{ id: "punish-ladder", name: "Enforcement Rules", path: "/dashboard/[guildId]/sanctions/punishment-ladder", is_enabled: true, is_restricted: false, category: "moderation" },
			{ id: "anticheat", name: "Anti-Cheat Matrix", path: "/dashboard/[guildId]/sanctions/anticheat", is_enabled: true, is_restricted: false, category: "moderation" },
			{ id: "settings-access", name: "Settings Access Control", path: "/dashboard/[guildId]/moderation/settings-access", is_enabled: true, is_restricted: false, category: "moderation" },
			// Tickets
			{ id: "tickets-live", name: "Live Support Hub", path: "/dashboard/[guildId]/tickets/active", is_enabled: true, is_restricted: false, category: "tickets" },
			{ id: "tickets-arch", name: "Archived Logs", path: "/dashboard/[guildId]/tickets/transcripts", is_enabled: true, is_restricted: false, category: "tickets" },
			{ id: "tickets-claim", name: "Staff Routing", path: "/dashboard/[guildId]/tickets/claims", is_enabled: true, is_restricted: false, category: "tickets" },
			{ id: "tickets-black", name: "Support Blacklist", path: "/dashboard/[guildId]/tickets/blacklist", is_enabled: true, is_restricted: false, category: "tickets" },
			{ id: "tickets-drop", name: "Drop Embed Panels", path: "/dashboard/[guildId]/tickets/panel-creator", is_enabled: true, is_restricted: false, category: "tickets" },
			// Toolkits
			{ id: "banners", name: "Banner Builder", path: "/dashboard/[guildId]/toolkits/banner-builder", is_enabled: true, is_restricted: false, category: "toolkits" },
			{ id: "brackets", name: "Bracket Builder", path: "/dashboard/[guildId]/toolkits/bracket-builder", is_enabled: true, is_restricted: false, category: "toolkits" },
			{ id: "webhooks", name: "Webhook Builder", path: "/dashboard/[guildId]/toolkits/webhook-builder", is_enabled: true, is_restricted: false, category: "toolkits" },
			{ id: "embeds", name: "Embed Studio", path: "/dashboard/[guildId]/toolkits/embeds", is_enabled: true, is_restricted: false, category: "toolkits" },
			{ id: "panels", name: "Panel Deployer", path: "/dashboard/[guildId]/toolkits/panel-deployer", is_enabled: true, is_restricted: false, category: "toolkits" },
			// Capabilities
			{ id: "perks", name: "Tier Perks", path: "/dashboard/[guildId]/capabilities/perks", is_enabled: true, is_restricted: false, category: "capabilities" },
			{ id: "giveaways", name: "Giveaways Engine", path: "/dashboard/[guildId]/capabilities/giveaways", is_enabled: true, is_restricted: false, category: "capabilities" },
			{ id: "reaction-roles", name: "Reaction Roles", path: "/dashboard/[guildId]/capabilities/reaction-roles", is_enabled: true, is_restricted: false, category: "capabilities" },
			{ id: "loggers", name: "Event Loggers", path: "/dashboard/[guildId]/capabilities/loggers", is_enabled: true, is_restricted: false, category: "capabilities" },
			{ id: "streaks", name: "Daily Streaks", path: "/dashboard/[guildId]/capabilities/streaks", is_enabled: true, is_restricted: false, category: "capabilities" },
			// Simulations
			{ id: "sim-elo", name: "ELO Projection", path: "/dashboard/[guildId]/simulators/elo", is_enabled: true, is_restricted: false, category: "simulations" },
			{ id: "sim-prog", name: "Rank Progression", path: "/dashboard/[guildId]/simulators/progression", is_enabled: true, is_restricted: false, category: "simulations" },
			{ id: "sim-party", name: "Party Balancing", path: "/dashboard/[guildId]/simulators/party", is_enabled: true, is_restricted: false, category: "simulations" },
			{ id: "sim-queue", name: "Queue Math", path: "/dashboard/[guildId]/simulators/queue", is_enabled: true, is_restricted: false, category: "simulations" },
			{ id: "sim-capt", name: "Captain Pick", path: "/dashboard/[guildId]/simulators/captain", is_enabled: true, is_restricted: false, category: "simulations" },
			{ id: "sim-strike", name: "Strike Preview", path: "/dashboard/[guildId]/simulators/strike-preview", is_enabled: true, is_restricted: false, category: "simulations" },
			// System
			{ id: "domain", name: "Portal Domain", path: "/dashboard/[guildId]/networking/public-domain", is_enabled: true, is_restricted: false, category: "system" },
			{ id: "audit", name: "Audit Tracing", path: "/dashboard/[guildId]/networking/audit-logs", is_enabled: true, is_restricted: false, category: "system" },
			{ id: "backups", name: "Backup & Restore", path: "/dashboard/[guildId]/networking/backups", is_enabled: true, is_restricted: false, category: "system" },
			{ id: "developer", name: "Developer Console", path: "/dashboard/[guildId]/developer", is_enabled: true, is_restricted: true, category: "system" },
			{ id: "contact", name: "Core Contact", path: "/dashboard/[guildId]/networking/contact", is_enabled: true, is_restricted: false, category: "system" },
		];

		// Default categories from navigation
		const defaultCategories: CategoryConfig[] = [
			{
				id: "matchmaking",
				name: "Matchmaking",
				is_enabled: true,
				is_restricted: false,
				pages: ["queues", "players", "matches", "ranks", "weights", "teams", "leaderboards", "parties"],
			},
			{
				id: "infrastructure",
				name: "Infrastructure",
				is_enabled: true,
				is_restricted: false,
				pages: ["hosting", "maps", "seasons", "proxies"],
			},
			{
				id: "moderation",
				name: "Sanctions & Security",
				is_enabled: true,
				is_restricted: false,
				pages: ["strike-logs", "strike-ladder", "punish-logs", "punish-ladder", "anticheat", "settings-access"],
			},
			{
				id: "tickets",
				name: "Ticket Subsystem",
				is_enabled: true,
				is_restricted: false,
				pages: ["tickets-live", "tickets-arch", "tickets-claim", "tickets-black", "tickets-drop"],
			},
			{
				id: "toolkits",
				name: "Creator Toolkits",
				is_enabled: true,
				is_restricted: false,
				pages: ["banners", "brackets", "webhooks", "embeds", "panels"],
			},
			{
				id: "capabilities",
				name: "Capabilities",
				is_enabled: true,
				is_restricted: false,
				pages: ["perks", "giveaways", "reaction-roles", "loggers", "streaks"],
			},
			{
				id: "simulations",
				name: "Simulation Models",
				is_enabled: true,
				is_restricted: false,
				pages: ["sim-elo", "sim-prog", "sim-party", "sim-queue", "sim-capt", "sim-strike"],
			},
		];

		setPageConfigs(defaultPages);
		setCategoryConfigs(defaultCategories);
		
		// Initialize saved state to match defaults (create new arrays to ensure reference equality)
		setSavedPageConfigs([...defaultPages]);
		setSavedCategoryConfigs([...defaultCategories]);
		setSavedUpdateLogs([]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDeveloper]);

	// Load developer configuration from database
	useEffect(() => {
		if (!isDeveloper || !dbGuildId) return;

		const loadDevConfig = async () => {
			try {
				const res = await fetch(`/api/db/guilds/${dbGuildId}/developer-config`);
				if (res.ok) {
					const data = await res.json();
					if (data.data) {
						const loadedLogs = data.data.update_logs || [];
						const loadedPages = data.data.page_configs && data.data.page_configs.length > 0 
							? data.data.page_configs 
							: pageConfigs;
						const loadedCategories = data.data.category_configs && data.data.category_configs.length > 0 
							? data.data.category_configs 
							: categoryConfigs;

						setUpdateLogs([...loadedLogs]);
						setPageConfigs([...loadedPages]);
						setCategoryConfigs([...loadedCategories]);
						
						// Set saved state to match loaded state (create new arrays for reference equality)
						setSavedUpdateLogs([...loadedLogs]);
						setSavedPageConfigs([...loadedPages]);
						setSavedCategoryConfigs([...loadedCategories]);
						
						setDbConfigured(true);
					}
				}
			} catch (error) {
				console.error("Failed to load developer config:", error);
				setDbConfigured(false);
				// If DB fails, set saved state to current default state (create new arrays for reference equality)
				setSavedUpdateLogs([...updateLogs]);
				setSavedPageConfigs([...pageConfigs]);
				setSavedCategoryConfigs([...categoryConfigs]);
			}
		};

		loadDevConfig();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isDeveloper, dbGuildId]);

	const handleSave = async () => {
		if (!dbGuildId) return;
		setIsSaving(true);
		setSaveError(null);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/developer-config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					update_logs: updateLogs,
					page_configs: pageConfigs,
					category_configs: categoryConfigs,
				}),
			});
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to save developer config");
			}
			
			// Update saved state to match current state after successful save
			setSavedUpdateLogs([...updateLogs]);
			setSavedPageConfigs([...pageConfigs]);
			setSavedCategoryConfigs([...categoryConfigs]);
			
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 2500);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Save failed");
		} finally {
			setIsSaving(false);
		}
	};

	const addUpdateLog = () => {
		if (!newLog.title || !newLog.content) return;
		const newLogEntry = {
			id: `log-${Date.now()}`,
			...newLog,
			date: new Date().toISOString(),
		};
		setUpdateLogs([...updateLogs, newLogEntry]);
		setNewLog({ title: "", content: "", version: "", is_featured: false });
	};

	const deleteUpdateLog = (id: string) => {
		setUpdateLogs(updateLogs.filter((log) => log.id !== id));
	};

	const togglePageEnabled = (pageId: string) => {
		setPageConfigs(
			pageConfigs.map((page) =>
				page.id === pageId ? { ...page, is_enabled: !page.is_enabled } : page
			)
		);
	};

	const togglePageRestricted = (pageId: string) => {
		setPageConfigs(
			pageConfigs.map((page) =>
				page.id === pageId ? { ...page, is_restricted: !page.is_restricted } : page
			)
		);
	};

	const toggleCategoryEnabled = (categoryId: string) => {
		setCategoryConfigs(
			categoryConfigs.map((cat) =>
				cat.id === categoryId ? { ...cat, is_enabled: !cat.is_enabled } : cat
			)
		);
	};

	const toggleCategoryRestricted = (categoryId: string) => {
		setCategoryConfigs(
			categoryConfigs.map((cat) =>
				cat.id === categoryId ? { ...cat, is_restricted: !cat.is_restricted } : cat
			)
		);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin text-primary-500" />
			</div>
		);
	}

	if (!isDeveloper) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center space-y-4">
					<Lock className="size-12 text-fg-muted mx-auto" />
					<p className="font-mono text-sm text-fg-muted uppercase tracking-wider">
						Developer Access Required
					</p>
					<p className="font-mono text-xs text-fg-muted">
						This page is only accessible to authorized developers.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="no-page-motion w-full p-6 lg:p-8 space-y-6 select-none max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Developer Console
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Live Configuration Panel
					</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && (
						<span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider">
							<CheckCircle2 className="size-3.5" /> Saved
						</span>
					)}
					<button
						onClick={() => setIsPreviewMode(!isPreviewMode)}
						className={`h-9 px-3 flex items-center gap-2 border font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm ${
							isPreviewMode 
								? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500" 
								: "border-border-subtle bg-panel-bg/40 hover:bg-panel-bg text-fg-muted"
						}`}
					>
						{isPreviewMode ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
						<span>{isPreviewMode ? "Exit Preview" : "Preview Mode"}</span>
					</button>
					<button
						onClick={handleSave}
						disabled={isSaving}
						className={`h-9 px-4 flex items-center gap-2 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 border ${
							isDirty
								? "border-warning/40 bg-warning/15 hover:bg-warning/25 text-warning"
								: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
						}`}
					>
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>{isSaving ? "Saving..." : "Commit Changes"}</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			{/* Developer info banner */}
			<div className="p-4 border border-primary-500/20 bg-primary-500/5 rounded-xl flex items-start gap-3">
				<Shield className="size-5 text-primary-500 shrink-0 mt-0.5" />
				<div className="space-y-1 text-left">
					<h3 className="font-mono text-xs font-bold text-fg-default uppercase tracking-wide">
						Developer Mode Active
					</h3>
					<p className="font-mono text-[10px] text-fg-muted leading-relaxed">
						You have full access to live configuration controls. Changes here affect the entire system immediately.
					</p>
				</div>
			</div>

			{!dbConfigured && (
				<div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl flex items-start gap-3">
					<AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
					<div className="space-y-1 text-left">
						<h3 className="font-mono text-xs font-bold text-fg-default uppercase tracking-wide">
							Database Not Configured
						</h3>
						<p className="font-mono text-[10px] text-fg-muted leading-relaxed">
							Developer configuration changes cannot be saved to the database. Changes will only persist in the current session.
						</p>
					</div>
				</div>
			)}

			{/* Tabs */}
			<div className="flex border-b border-border-subtle/40 gap-2">
					{(["logs", "navigation", "access"] as const).map((tab) => {
					const isActive = activeTab === tab;
					const isDirtyTab = tabGuard.isTabDirty(tab);
					return (
						<button
							key={tab}
							onClick={() => tabGuard.requestTabSwitch(tab)}
							className={`relative px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
								isActive
									? "border-primary-500 text-primary-500"
									: "border-transparent text-fg-muted hover:text-fg-default"
							}`}
						>
							{tab === "logs" && <Clock className="size-3.5" />}
								{tab === "navigation" && <Code className="size-3.5" />}
								{tab === "access" && <Lock className="size-3.5" />}
								{tab === "logs" && "Update Logs"}
								{tab === "navigation" && "Navigation Control"}
								{tab === "access" && "Access Control"}
							{/* Dirty dot indicator */}
							{isDirtyTab && (
								<span className="size-1.5 rounded-full bg-warning shrink-0" title="Unsaved changes" />
							)}
						</button>
					);
				})}
			</div>

			{/* ── Tab-switch guard banner ── */}
			{tabGuard.pendingTab && (
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-warning/30 bg-warning/10 animate-in fade-in slide-in-from-top-1 duration-200">
					<div className="flex items-center gap-3">
						<AlertTriangle className="size-4 text-warning shrink-0" />
						<div className="text-left">
							<p className="font-mono text-[10px] font-bold uppercase tracking-wider text-warning">
								Unsaved changes in &ldquo;{TAB_LABELS[activeTab]}&rdquo;
							</p>
							<p className="font-mono text-[9px] text-warning/70 uppercase tracking-wide mt-0.5">
								Save or discard before switching tabs.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<button
							onClick={tabGuard.cancelTabSwitch}
							className="h-8 px-3 font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg border border-border-subtle bg-panel-bg/40 text-fg-default hover:bg-panel-bg transition-all active:scale-98 cursor-pointer"
						>
							Stay
						</button>
						<button
							onClick={tabGuard.confirmTabSwitch}
							className="h-8 px-3 font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg border border-warning/40 bg-warning/15 text-warning hover:bg-warning/25 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
						>
							Discard &amp; Switch
							<ArrowRight className="size-3" />
						</button>
					</div>
				</div>
			)}

			{/* Tab Content */}
			{activeTab === "logs" && (
				<div className="space-y-6">
					{/* Add new log */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Plus className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Add Developer Update Log
							</h3>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
									Title
								</label>
								<input
									type="text"
									value={newLog.title}
									onChange={(e) => setNewLog({ ...newLog, title: e.target.value })}
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
									Version
								</label>
								<input
									type="text"
									value={newLog.version}
									onChange={(e) => setNewLog({ ...newLog, version: e.target.value })}
									placeholder="v1.0.0"
									className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">
								Content
							</label>
							<textarea
								rows={3}
								value={newLog.content}
								onChange={(e) => setNewLog({ ...newLog, content: e.target.value })}
								className="w-full p-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50 resize-none"
							/>
						</div>
						<div className="flex items-center justify-between">
							<span className="font-mono text-[10px] text-fg-default uppercase tracking-wider">
								Featured
							</span>
							<button
								onClick={() => setNewLog({ ...newLog, is_featured: !newLog.is_featured })}
								className={`h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
									newLog.is_featured
										? "bg-primary-500/10 border-primary-500/30 text-primary-500"
										: "bg-panel-bg border-border-subtle text-fg-muted"
								}`}
							>
								{newLog.is_featured ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
								{newLog.is_featured ? "Yes" : "No"}
							</button>
						</div>
						<button
							onClick={addUpdateLog}
							className="h-8 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
						>
							<Plus className="size-3.5" /> Add Log
						</button>
					</div>

					{/* Existing logs */}
					<div className="space-y-4">
						{updateLogs.length === 0 ? (
							<div className="p-8 border border-dashed border-border-subtle/60 rounded-xl text-center">
								<p className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
									No update logs yet
								</p>
							</div>
						) : (
							updateLogs.map((log) => (
								<div
									key={log.id}
									className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<h4 className="font-mono text-sm font-bold text-fg-default uppercase tracking-wider">
													{log.title}
												</h4>
												{log.is_featured && (
													<span className="font-mono text-[8px] font-black uppercase tracking-widest text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded">
														Featured
													</span>
												)}
											</div>
											<p className="font-mono text-[9px] text-fg-muted mt-1">
												{log.version} • {new Date(log.date).toLocaleDateString()}
											</p>
										</div>
										<button
											onClick={() => deleteUpdateLog(log.id)}
											className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-lg transition-all cursor-pointer"
										>
											<Trash2 className="size-3.5" />
										</button>
									</div>
									<p className="font-mono text-xs text-fg-default leading-relaxed">{log.content}</p>
								</div>
							))
						)}
					</div>
				</div>
			)}

				{activeTab === "navigation" && (
					<div className="space-y-5">
					<div className="mb-4 flex flex-col gap-3 rounded-xl border border-border-subtle bg-panel-bg/20 p-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-default">Navigation Control</p>
							<p className="mt-1 font-mono text-[10px] text-fg-muted">Manage standalone pages and grouped categories from one view.</p>
						</div>
						<input value={navigationQuery} onChange={(event) => setNavigationQuery(event.target.value)} placeholder="Filter pages or categories..." className="h-9 w-full rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 font-mono text-xs text-fg-default outline-none focus:border-primary-500/50 sm:max-w-xs" />
					</div>
						<div className="space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Code className="size-4 text-violet-500" />
							<h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-fg-default">Categories &amp; Groups</h3>
						</div>
					<div className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Code className="size-4 text-violet-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Category Control
							</h3>
						</div>
							<p className="font-mono text-[10px] text-fg-muted leading-relaxed">
								Disable an entire category or fine-tune the individual pages inside it. Category locks apply to every page in the group, so you only configure each visibility rule once.
							</p>
					</div>

					{categoryConfigs.length === 0 ? (
						<div className="p-8 border border-dashed border-border-subtle/60 rounded-xl text-center">
							<p className="font-mono text-[10px] text-fg-muted uppercase tracking-wider">
								No categories configured yet
							</p>
						</div>
					) : (
							categoryConfigs.filter((category) => !navigationQuery || `${category.name} ${category.pages.map((id) => pageConfigs.find((page) => page.id === id)?.name ?? "")}`.toLowerCase().includes(navigationQuery.toLowerCase())).map((category) => (
								<div
								key={category.id}
								className={`p-4 border ${isPreviewMode && !category.is_enabled ? 'border-dashed border-border-subtle/30 opacity-50' : 'border-border-subtle'} bg-panel-bg/20 rounded-xl space-y-3`}
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{category.is_restricted && <Lock className="size-3.5 text-amber-500" />}
										<div>
											<p className="font-mono text-sm font-bold text-fg-default uppercase tracking-wider">
												{category.name}
											</p>
											<p className="font-mono text-[9px] text-fg-muted mt-0.5">
												{category.pages.length} pages
											</p>
										</div>
									</div>
									{!isPreviewMode && (
										<div className="flex items-center gap-2">
											<button
												onClick={() => toggleCategoryEnabled(category.id)}
												className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
													category.is_enabled
														? "bg-success/10 border-success/30 text-success"
														: "bg-panel-bg border-border-subtle text-fg-muted"
												}`}
											>
												{category.is_enabled ? (
													<ToggleRight className="size-4" />
												) : (
													<ToggleLeft className="size-4" />
												)}
												<span>{category.is_enabled ? "Visible" : "Hidden"}</span>
											</button>
											<button
												onClick={() => toggleCategoryRestricted(category.id)}
												className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
													category.is_restricted
														? "bg-amber-500/10 border-amber-500/30 text-amber-500"
														: "bg-panel-bg border-border-subtle text-fg-muted"
												}`}
											>
												<Lock className="size-3.5" />
												<span>{category.is_restricted ? "Locked" : "Public"}</span>
											</button>
										</div>
									)}
								</div>
								{category.pages.length > 0 && (
									<div className="pl-3 border-l border-border-subtle/30 space-y-1">
									{category.pages.map((pageId) => {
										const page = pageConfigs.find((p) => p.id === pageId);
										if (!page || (navigationQuery && !`${page.name} ${page.path}`.toLowerCase().includes(navigationQuery.toLowerCase()))) return null;
										return (
											<div key={pageId} className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle/30 bg-bg-canvas/20 px-3 py-2">
												<div className="min-w-0">
													<div className="flex items-center gap-2">
														{page.is_restricted && <Lock className="size-3 text-amber-500" />}
														<p className="truncate font-mono text-[10px] font-bold uppercase tracking-wider text-fg-default">{page.name}</p>
														{!page.is_enabled && <span className="font-mono text-[8px] uppercase tracking-wider text-danger">Disabled</span>}
													</div>
													<p className="font-mono text-[9px] text-fg-muted">{page.path}</p>
												</div>
												{!isPreviewMode && (
													<div className="flex shrink-0 items-center gap-2">
														<button onClick={() => togglePageEnabled(page.id)} className={`h-7 px-2.5 border rounded-md font-mono text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${page.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
															{page.is_enabled ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
															{page.is_enabled ? "On" : "Off"}
														</button>
														<button onClick={() => togglePageRestricted(page.id)} className={`h-7 px-2.5 border rounded-md font-mono text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${page.is_restricted ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
															<Lock className="size-3" /> {page.is_restricted ? "Locked" : "Public"}
														</button>
													</div>
												)}
											</div>
										);
									})}
									</div>
								)}
							</div>
						))
					)}
											</div>
						</div>
					)}

					{activeTab === "access" && (
				<div className="space-y-4">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Lock className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Access Control & Preview
							</h3>
						</div>
						<p className="font-mono text-[10px] text-fg-muted leading-relaxed">
							As a developer, you can access and configure any guild's nodes and settings directly. Use preview mode to see what normal users experience.
						</p>
					</div>

					<div className="p-5 border border-primary-500/20 bg-primary-500/5 rounded-xl space-y-4">
						<div className="flex items-center gap-3">
							<Shield className="size-5 text-primary-500" />
							<div>
								<h4 className="font-mono text-xs font-bold text-fg-default uppercase tracking-wide">
									Developer Access
								</h4>
								<p className="font-mono text-[9px] text-fg-muted mt-1">
									Cross-guild access is enabled for your developer account
								</p>
							</div>
						</div>
					</div>

					<div className="p-5 border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-4">
						<div className="flex items-center gap-3">
							<Eye className="size-5 text-amber-500" />
							<div>
								<h4 className="font-mono text-xs font-bold text-fg-default uppercase tracking-wide">
									Preview Mode
								</h4>
								<p className="font-mono text-[9px] text-fg-muted mt-1">
									Enable preview mode to see the navigation and page visibility as a normal user would experience it
								</p>
							</div>
						</div>
						<button
							onClick={() => setIsPreviewMode(!isPreviewMode)}
							className={`w-full h-9 px-4 flex items-center justify-center gap-2 font-mono font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer border ${
								isPreviewMode 
									? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500" 
									: "border-border-subtle bg-panel-bg/40 hover:bg-panel-bg text-fg-muted"
							}`}
						>
							{isPreviewMode ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
							<span>{isPreviewMode ? "Exit Preview Mode" : "Enter Preview Mode"}</span>
						</button>
					</div>

					{isPreviewMode && (
						<div className="p-4 border border-dashed border-amber-500/30 bg-amber-500/5 rounded-xl space-y-3">
							<div className="flex items-center gap-2">
								<Eye className="size-4 text-amber-500" />
								<h4 className="font-mono text-xs font-bold text-amber-500 uppercase tracking-wide">
									Preview Active
								</h4>
							</div>
							<p className="font-mono text-[9px] text-fg-muted leading-relaxed">
								You are currently viewing the configuration as a normal user. Disabled pages and restricted categories will appear hidden or locked. Navigation reflects the current visibility settings.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
