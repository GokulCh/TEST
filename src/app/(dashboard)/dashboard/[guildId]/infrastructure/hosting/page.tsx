"use client";

import {
	Activity,
	AlertCircle,
	Bot,
	CheckCircle2,
	Cpu,
	Lock,
	Loader2,
	Plus,
	Save,
	Server,
	ToggleLeft,
	ToggleRight,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { BotStatus } from "@/lib/db-types";

type BotTier = "titan" | "champion";

interface BotAccount {
	username: string;
	stable_id?: string;
	status: BotStatus;
	tier?: BotTier;
	is_enabled: boolean;
	password?: string; // Only for new passwords, never sent from server
	has_password: boolean; // Indicates if password is set
}

const STATUS_META: Record<BotStatus, { label: string; className: string }> = {
	offline: {
		label: "Offline",
		className: "text-fg-muted bg-panel-bg border-border-subtle",
	},
	starting: {
		label: "Starting",
		className: "text-amber-400 bg-amber-500/10 border-amber-500/30",
	},
	available: {
		label: "Available",
		className: "text-success bg-success/10 border-success/30",
	},
	busy: {
		label: "Busy",
		className: "text-rose-400 bg-rose-500/10 border-rose-500/30",
	},
	cooldown: {
		label: "Cooldown",
		className: "text-sky-400 bg-sky-500/10 border-sky-500/30",
	},
};

export default function Page() {
	const { dbGuildId } = useGuildConfig();
	const [isSaving, setIsSaving] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const [bots, setBots] = useState<BotAccount[]>([]);

	const [server, setServer] = useState({
		host: "",
		port: 25565,
		version: "1.8.9",
		is_enabled: false,
	});

	// Saved state for unsaved changes detection
	const [savedBots, setSavedBots] = useState<BotAccount[]>([]);

	// Load bots from API
	useEffect(() => {
		if (!dbGuildId) return;

		const loadBots = async () => {
			setIsLoading(true);
			try {
				const res = await fetch(`/api/db/guilds/${dbGuildId}/bots`);
				if (res.ok) {
					const data = await res.json();
					const botsData = data.data || [];
					setBots(botsData);
					setSavedBots(botsData);
				}
			} catch (error) {
				console.error("Failed to load bots:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadBots();
	}, [dbGuildId]);

	const updateBot = (index: number, updates: Partial<BotAccount>) => {
		setBots((prev) => prev.map((b, i) => (i === index ? { ...b, ...updates } : b)));
	};

	const handleAddBot = () => {
		setBots((prev) => [
			...prev,
			{
				username: "NewBotAccount",
				stable_id: "new_bot",
				status: "offline",
				tier: "champion",
				is_enabled: true,
				password: "",
				has_password: false,
			},
		]);
	};

	const handleDeleteBot = (index: number) => {
		setBots((prev) => prev.filter((_, i) => i !== index));
	};

	// Global unsaved changes detection
	const globalLocal = useMemo(() => ({ bots }), [bots]);
	const globalSaved = useMemo(() => ({ bots: savedBots }), [savedBots]);
	const { isDirty } = useUnsavedChanges(globalLocal, globalSaved);

	const handleSaveChanges = async () => {
		if (!dbGuildId) return;
		setIsSaving(true);
		setSaveError(null);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/bots`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bots }),
			});
			if (!res.ok) throw new Error("Failed to save bots");
			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 2500);
			// Update saved state after successful save
			setSavedBots(bots);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Save failed");
		} finally {
			setIsSaving(false);
		}
	};

	const availableBots = bots.filter((b) => b.status === "available").length;
	const busyBots = bots.filter((b) => b.status === "busy").length;
	const offlineBots = bots.filter(
		(b) => b.status === "offline" || b.status === "cooldown"
	).length;
	const titanBots = bots.filter((b) => b.tier === "titan").length;
	const championBots = bots.filter((b) => b.tier === "champion").length;

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* HUD PANEL HEADER */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Infrastructure Bot Registry
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Bot Nodes
					</h2>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && (
						<span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider">
							<CheckCircle2 className="size-3.5" /> Saved
						</span>
					)}
					<button
						onClick={handleSaveChanges}
						disabled={isSaving}
						className={`h-9 px-4 flex items-center gap-2 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 border ${
							isDirty
								? "border-warning/40 bg-warning/15 hover:bg-warning/25 text-warning"
								: "border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500"
						}`}
					>
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>
							{isSaving ? "Publishing Bot Registry..." : "Commit Bot Registry"}
						</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			{/* ACTION BAR */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
						Game Bot Account Registry
					</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">
						Register Minecraft bot accounts that the matchmaker stages to host
						live match instances
					</p>
				</div>
				<button
					onClick={handleAddBot}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Register Bot Account
				</button>
			</div>

			{/* THREE-COLUMN GRID */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* BOT REGISTRY LIST */}
				<div className="lg:col-span-2 space-y-4">
					{bots.map((bot, index) => (
						<div
							key={index}
							className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs"
						>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Bot Username
									</label>
									<input
										type="text"
										value={bot.username}
										onChange={(e) => updateBot(index, { username: e.target.value })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Stable ID
									</label>
									<input
										type="text"
										value={bot.stable_id ?? ""}
										onChange={(e) => updateBot(index, { stable_id: e.target.value || undefined })}
										className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									/>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Password
									</label>
									<div className="relative">
										<input
											type="password"
											value={bot.password ?? ""}
											onChange={(e) => updateBot(index, { password: e.target.value })}
											placeholder={bot.has_password ? "•••••••• (encrypted)" : "Set new password"}
											className="w-full h-8 px-2.5 pr-8 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
										/>
										{bot.has_password && (
											<Lock className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-success" />
										)}
									</div>
								</div>

								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">
										Tier Class
									</label>
									<select
										value={bot.tier ?? "champion"}
										onChange={(e) =>
											updateBot(index, { tier: e.target.value as BotTier })
										}
										className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none"
									>
										<option value="titan">Titan</option>
										<option value="champion">Champion</option>
									</select>
								</div>

								<div className="flex gap-2 justify-end sm:justify-start">
									<button
										onClick={() =>
											updateBot(index, { is_enabled: !bot.is_enabled })
										}
										className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
											bot.is_enabled
												? "bg-success/10 border-success/30 text-success"
												: "bg-panel-bg border-border-subtle text-fg-muted"
										}`}
									>
										{bot.is_enabled ? (
											<ToggleRight className="size-4" />
										) : (
											<ToggleLeft className="size-4" />
										)}
										<span>{bot.is_enabled ? "Enabled" : "Disabled"}</span>
									</button>

									<button
										onClick={() => handleDeleteBot(index)}
										className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md transition-all cursor-pointer"
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-border-subtle/10">
								<div className="flex items-center gap-1.5">
									<span className="font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">
										Runtime State
									</span>
									<select
										value={bot.status}
										onChange={(e) =>
											updateBot(index, {
												status: e.target.value as BotStatus,
											})
										}
										className="h-7 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-[10px] text-fg-default focus:outline-none"
									>
										<option value="offline">Offline</option>
										<option value="starting">Starting</option>
										<option value="available">Available</option>
										<option value="busy">Busy</option>
										<option value="cooldown">Cooldown</option>
									</select>
								</div>

								<div className="flex items-center gap-2">
									<span
										className={`inline-flex items-center gap-1 font-mono text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${STATUS_META[bot.status].className}`}
									>
										{STATUS_META[bot.status].label}
									</span>
									<span className="inline-flex items-center gap-1 font-mono text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
										{bot.tier === "titan" ? "Titan Class" : "Champion Class"}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* ENGINE TELEMETRY PANELS */}
				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Server className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Linked Match Server
							</h3>
						</div>

						<div className="space-y-2 font-mono text-[10px] text-fg-muted uppercase">
							<div className="flex justify-between">
								<span>Endpoint:</span>
								<span className="text-fg-default font-bold">
									{server.host}:{server.port}
								</span>
							</div>
							<div className="flex justify-between">
								<span>MC Version:</span>
								<span className="text-fg-default font-bold">{server.version}</span>
							</div>
							<div className="flex justify-between">
								<span>Link State:</span>
								<span className={server.is_enabled ? "text-success" : "text-fg-muted"}>
									{server.is_enabled ? "Connected" : "Disconnected"}
								</span>
							</div>
						</div>

						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							The connection endpoint, auth strategy, verification provider and
							tier keyword filters are managed under the Instance Proxies
							registry.
						</p>
					</div>

					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Activity className="size-4 text-violet-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Bot Pool Telemetry
							</h3>
						</div>

						<div className="space-y-3 font-mono text-[10px] text-fg-muted uppercase">
							<div className="flex justify-between">
								<span>Registered Accounts:</span>
								<span className="text-fg-default font-bold">{bots.length}</span>
							</div>
							<div className="flex justify-between">
								<span>Available For Matches:</span>
								<span className="text-success">{availableBots}</span>
							</div>
							<div className="flex justify-between">
								<span>Currently In Queue:</span>
								<span className="text-rose-400">{busyBots}</span>
							</div>
							<div className="flex justify-between">
								<span>Offline / Cooldown:</span>
								<span className="text-fg-muted">{offlineBots}</span>
							</div>
							<div className="flex justify-between">
								<span>Titan Class:</span>
								<span className="text-amber-400">{titanBots}</span>
							</div>
							<div className="flex justify-between">
								<span>Champion Class:</span>
								<span className="text-cyan-400">{championBots}</span>
							</div>
						</div>
					</div>

					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Bot className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Bot Pool Overview
							</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Registered bot accounts are staged by the matchmaker to host live
							instances on the configured match server. Tier classifies rotated
							titan or champion accounts, while status reflects the live runtime
							state of each account.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}