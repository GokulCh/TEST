"use client";

import {
	AlertCircle,
	ArrowUpRight,
	Bot,
	Cpu,
	Loader2,
	Palette,
	RefreshCw,
	Save,
	Server,
	ShieldAlert,
	Sparkles,
	Swords,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { QueueConfig, GuildAppearanceConfig } from "@/lib/db-types";

// Simple markdown formatter for bio preview
const formatBio = (text: string | null | undefined): string => {
	if (!text) return "Bot profile description.";
	
	// Escape HTML to prevent XSS
	let formatted = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
	
	// Handle bold: *text* or **text**
	formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
	formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
	
	// Handle italic: _text_ or __text__
	formatted = formatted.replace(/__(.*?)__/g, '<em>$1</em>');
	formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
	
	// Handle code: `text`
	formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-neutral-700 px-1 rounded text-xs">$1</code>');
	
	// Handle new lines
	formatted = formatted.replace(/\n/g, '<br />');
	
	return formatted;
};

interface GuildStats {
	activeGames: number;
	totalGames: number;
	activeStrikes: number;
	registeredPlayers: number;
}

const devChangeLogs: never[] = [];

export default function Page() {
	const params = useParams();
	const guildId = params?.guildId as string | undefined;
	const { dbGuildId, queues, config, meta, isLoading: configLoading, saveConfigSection } = useGuildConfig();

	const [stats, setStats] = useState<GuildStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(false);
	const [statsError, setStatsError] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isGuildEnabled, setIsGuildEnabled] = useState(true);
	const [isSavingGuild, setIsSavingGuild] = useState(false);



	// Bot appearance config
	const [appearance, setAppearance] = useState<GuildAppearanceConfig>({
		nickname: null, avatar: null, bio: null, banner: null,
	});
	const [savedAppearance, setSavedAppearance] = useState<GuildAppearanceConfig | null>(null);
	const [isSavingAppearance, setIsSavingAppearance] = useState(false);

	const { isDirty } = useUnsavedChanges(appearance, savedAppearance);

	const loadStats = useCallback(async (showSpinner = false) => {
		if (!dbGuildId) return;
		if (showSpinner) setIsRefreshing(true);
		setStatsLoading(true);
		setStatsError(null);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/stats`);
			if (!res.ok) throw new Error(`Stats fetch failed (${res.status})`);
			const data = await res.json();
			setStats(data.data);
		} catch (e) {
			setStatsError(e instanceof Error ? e.message : "Failed to load stats");
		} finally {
			setStatsLoading(false);
			setIsRefreshing(false);
		}
	}, [dbGuildId]);

	useEffect(() => {
		if (dbGuildId) loadStats();
	}, [dbGuildId, loadStats]);

	// Sync config from DB
	useEffect(() => {
		if (!config) return;
		if (config.appearance) {
			const synced: GuildAppearanceConfig = {
				nickname: config.appearance.nickname ?? null,
				avatar: config.appearance.avatar ?? null,
				bio: config.appearance.bio ?? null,
				banner: config.appearance.banner ?? null,
			};
			setAppearance(synced);
			setSavedAppearance(synced);
		}
	}, [config]);

	const handleToggleGuild = async () => {
		if (!dbGuildId) return;
		setIsSavingGuild(true);
		try {
			const newValue = !isGuildEnabled;
			setIsGuildEnabled(newValue);
			// This would need an API endpoint to save guild enabled state
			// For now, we'll just update local state
		} catch (error) {
			console.error("Failed to toggle guild state:", error);
		} finally {
			setIsSavingGuild(false);
		}
	};

	const handleSaveAppearance = async () => {
		if (!dbGuildId) return;
		setIsSavingAppearance(true);
		try {
			await saveConfigSection("appearance", appearance);
			setSavedAppearance(appearance);
		} catch (error) {
			console.error("Failed to save appearance:", error);
		} finally {
			setIsSavingAppearance(false);
		}
	};

	const statCards = [
		{
			label: "Registered Players",
			value: stats ? stats.registeredPlayers.toLocaleString() : "—",
			change: "Total",
			icon: Users,
			color: "text-violet-500",
			bg: "bg-violet-500/10",
			direction: "up" as const,
		},
		{
			label: "Live Match Instances",
			value: stats ? String(stats.activeGames) : "—",
			change: "Active",
			icon: Swords,
			color: "text-cyan-500",
			bg: "bg-cyan-500/10",
			direction: "neutral" as const,
		},
		{
			label: "Active Strikes",
			value: stats ? String(stats.activeStrikes) : "—",
			change: stats?.activeStrikes === 0 ? "Clean" : "Pending",
			icon: ShieldAlert,
			color: "text-rose-500",
			bg: "bg-rose-500/10",
			direction: stats?.activeStrikes === 0 ? "up" as const : "down" as const,
		},
		{
			label: "Total Games Played",
			value: stats ? stats.totalGames.toLocaleString() : "—",
			change: "All-time",
			icon: Server,
			color: "text-emerald-500",
			bg: "bg-emerald-500/10",
			direction: "neutral" as const,
		},
	];



	const isPageLoading = configLoading || (statsLoading && !stats);

	return (
		<div className="relative w-full overflow-hidden p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto"><div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary-500/[0.06] blur-3xl" /><div className="pointer-events-none absolute right-12 top-20 hidden size-24 rotate-12 rounded-2xl border border-primary-500/10 lg:block" />
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[11px] font-bold uppercase tracking-widest text-fg-muted">
						// Community overview
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Overview
					</h2>
				</div>
				<div className="flex items-center gap-3 self-start sm:self-auto">
					{/* Guild Enable/Disable Toggle */}
					<div className="flex items-center gap-2 px-3 py-1.5 bg-bg-canvas/40 border border-border-subtle rounded-lg">
						<span className="font-mono text-[10px] font-bold text-fg-muted uppercase tracking-wider">
							Bot Status
						</span>
						<button
							onClick={handleToggleGuild}
							disabled={isSavingGuild}
							className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${isGuildEnabled ? "bg-success" : "bg-fg-muted/30"}`}
						>
							<span
								className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform duration-200 ${isGuildEnabled ? "translate-x-4" : "translate-x-0"}`}
							/>
						</button>
						<span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${isGuildEnabled ? "text-success" : "text-fg-muted"}`}>
							{isGuildEnabled ? "Active" : "Disabled"}
						</span>
					</div>
					<button
						onClick={() => loadStats(true)}
						disabled={isRefreshing}
						className="h-9 px-4 flex items-center gap-2 border border-border-subtle bg-panel-bg/40 text-fg-default font-mono font-bold text-[12px] uppercase tracking-wider rounded-lg transition-all hover:bg-panel-bg hover:border-primary-500/40 active:scale-98 cursor-pointer shadow-sm disabled:opacity-60"
					>
						<RefreshCw className={`size-4 text-fg-muted ${isRefreshing ? "animate-spin text-primary-500" : ""}`} />
						<span>Sync Stream</span>
					</button>
				</div>
			</div>

			{/* Stats error */}
			{statsError && (
				<div className="flex items-center gap-3 p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-5 shrink-0" />
					<p className="font-mono text-sm uppercase">{statsError}</p>
				</div>
			)}

			{/* Loading skeleton */}
			{isPageLoading && (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="size-6 animate-spin text-primary-500" />
				</div>
			)}

			{!isPageLoading && (
				<>
					{/* Stat grid */}
					<div data-tour="overview-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{statCards.map((stat, i) => {
							const Icon = stat.icon;
							return (
								<div
									key={i}
									className="p-4 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl shadow-sm flex items-center justify-between transition-all hover:border-border-subtle/80 group"
								>
									<div className="space-y-1.5 min-w-0">
										<span className="block font-mono text-[12px] font-bold text-fg-muted uppercase tracking-wider truncate">
											{stat.label}
										</span>
										<div className="flex items-baseline gap-2">
											<span className="text-2xl font-black tracking-tight text-fg-default font-mono">
												{stat.value}
											</span>
											{stat.direction !== "neutral" && (
												<span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${stat.direction === "up" ? "text-success bg-success/10" : "text-red-500 bg-red-500/10"}`}>
													{stat.direction === "up" ? "↑" : "↓"}
												</span>
											)}
											{stat.direction === "neutral" && (
												<span className="font-mono text-[10px] font-bold text-success uppercase tracking-widest bg-success/10 px-1.5 py-0.5 rounded">
													{stat.change}
												</span>
											)}
										</div>
									</div>
									<div className={`size-12 rounded-lg flex items-center justify-center shrink-0 border border-border-subtle/30 shadow-inner group-hover:scale-105 transition-transform ${stat.bg}`}>
										<Icon className={`size-6 ${stat.color}`} />
									</div>
								</div>
							);
						})}
					</div>

					{/* Connected services */}
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl shadow-sm text-left space-y-4">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Cpu className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[12px] font-bold text-fg-default uppercase tracking-widest">
Connected services
							</h3>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg space-y-1">
								<span className="block font-mono text-[11px] font-bold text-fg-muted uppercase tracking-wider">Database API</span>
								<span className="font-mono text-base font-black text-fg-default">Connected <span className="text-xs text-success font-normal">// Online</span></span>
							</div>
							<div className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg space-y-1">
								<span className="block font-mono text-[11px] font-bold text-fg-muted uppercase tracking-wider">Guild DB ID</span>
								<span className="font-mono text-sm font-black text-fg-default select-all">{dbGuildId ?? "Resolving..."}</span>
							</div>
							<div className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg space-y-1">
								<span className="block font-mono text-[11px] font-bold text-fg-muted uppercase tracking-wider">Snowflake</span>
								<span className="font-mono text-sm font-black text-fg-default select-all">{guildId ?? "—"}</span>
							</div>
						</div>
					</div>

					{/* Bot Identity & Discord Profile Preview */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Left: Configuration Form */}
						<div data-tour="bot-identity" className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl shadow-sm space-y-4">
							<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
								<div className="flex items-center gap-2">
									<Palette className="size-4 text-violet-500" />
									<h3 className="font-mono text-[12px] font-bold text-fg-default uppercase tracking-widest">Bot Identity Configuration</h3>
								</div>
								<button
									onClick={handleSaveAppearance}
									disabled={isSavingAppearance}
									className={`h-8 px-3 flex items-center gap-2 border font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 ${
										isDirty
											? "border-warning/40 bg-warning/10 hover:bg-warning/20 text-warning"
											: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
									}`}
								>
									{isSavingAppearance ? (
										<div className="size-3 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
									) : (
										<Save className="size-3" />
									)}
									<span>{isSavingAppearance ? "Saving..." : "Save"}</span>
								</button>
							</div>
								<div className="space-y-1.5 text-left">
									<label className="block font-mono text-[12px] font-bold text-fg-default uppercase tracking-wider">Bot Instance Nickname</label>
									<input type="text" value={appearance.nickname ?? ""} onChange={(e) => setAppearance({ ...appearance, nickname: e.target.value || null })} className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div className="space-y-1.5 text-left">
										<label className="block font-mono text-[12px] font-bold text-fg-default uppercase tracking-wider">Avatar URL</label>
										<input type="text" value={appearance.avatar ?? ""} onChange={(e) => setAppearance({ ...appearance, avatar: e.target.value || null })} placeholder="https://cdn.example.com/avatar.png" className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
									</div>
									<div className="space-y-1.5 text-left">
										<label className="block font-mono text-[12px] font-bold text-fg-default uppercase tracking-wider">Banner URL</label>
										<input type="text" value={appearance.banner ?? ""} onChange={(e) => setAppearance({ ...appearance, banner: e.target.value || null })} placeholder="https://cdn.example.com/banner.png" className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
									</div>
								</div>
							<div className="space-y-1.5 text-left">
								<label className="block font-mono text-[12px] font-bold text-fg-default uppercase tracking-wider">About Me Description</label>
								<textarea rows={3} value={appearance.bio ?? ""} onChange={(e) => setAppearance({ ...appearance, bio: e.target.value || null })} className="w-full p-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50 resize-none leading-relaxed" placeholder="Supports basic markdown formatting" />
								<div className="font-mono text-[9px] text-fg-muted uppercase mt-1">
									*bold* • _italic_ • `code` • New lines preserved
								</div>
							</div>
						</div>

						{/* Right: Discord Profile Preview */}
						<div className="space-y-4 h-fit">
							<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5 px-1">
								<div className="flex items-center gap-2">
									<span className="size-4 text-fg-muted">👁️</span>
									<h3 className="font-mono text-[11px] font-bold text-fg-muted uppercase tracking-widest">Discord Profile Preview</h3>
								</div>
								<div className="font-mono text-[9px] font-black uppercase text-success bg-success/10 px-1 rounded">WYSIWYG</div>
							</div>
							<div className="w-full bg-[#18191c] rounded-xl overflow-hidden text-left font-sans select-none border border-neutral-800 shadow-2xl">
								<div className={`h-24 w-full relative ${appearance.banner ? "bg-gradient-to-r from-indigo-900 to-purple-900" : "bg-neutral-700"}`}>
									{appearance.banner && <img src={appearance.banner} alt="" className="absolute inset-0 w-full h-full object-cover" />}
									{appearance.banner && <div className="absolute inset-0 flex items-center justify-center opacity-20"><Sparkles className="size-12 text-white/40 rotate-12" /></div>}
								</div>
								<div className="px-4 pb-4 relative">
									<div className="absolute -top-9 left-4 size-16 rounded-full bg-[#18191c] p-1">
										{appearance.avatar ? (
											<img src={appearance.avatar} alt="" className="size-full rounded-full object-cover" />
										) : (
											<div className="size-full rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-600 to-cyan-500">
												<Bot className="size-8 text-white" />
											</div>
										)}
										<div className="absolute bottom-0 right-0 size-3.5 bg-[#23a55a] rounded-full border-2 border-[#18191c]" />
									</div>
									<div className="pt-9 space-y-3">
										<div className="flex items-center gap-1.5">
											<span className="text-white font-bold text-base tracking-wide">{appearance.nickname || "Unnamed Bot"}</span>
											<span className="bg-[#5865f2] text-white text-[9px] font-extrabold px-1 rounded uppercase">BOT</span>
										</div>
										<div className="h-px bg-neutral-800/80" />
										<div className="space-y-1">
											<h5 className="text-[10px] font-bold text-white uppercase tracking-wide">About Me</h5>
											<p 
												className="text-neutral-300 text-xs leading-relaxed font-light"
												dangerouslySetInnerHTML={{ __html: formatBio(appearance.bio) }}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>


				</>
			)}
		</div>
	);
}
