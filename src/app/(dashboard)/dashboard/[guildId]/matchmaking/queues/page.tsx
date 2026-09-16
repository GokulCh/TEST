"use client";

import {
	AlertCircle,
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Database,
	Loader2,
	Network,
	Plus,
	Save,
	ToggleLeft,
	ToggleRight,
	Trash2,
	Trophy,
	Users,
	Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useTabGuard } from "@/hooks/use-tab-guard";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import type { ModeConfig, QueueConfig } from "@/lib/db-types";
import CategoryDropdown from "@/components/ui/CategoryDropdown";
import ChannelDropdown from "@/components/ui/ChannelDropdown";

type TabVariant = "modes" | "architecture";
type ModeType = "casual" | "classic" | "captain" | "party" | "event" | "elo" | "standard";

const MODE_TYPES: ModeType[] = ["casual", "classic", "captain", "party", "event", "elo", "standard"];

const TAB_LABELS: Record<TabVariant, string> = {
	modes: "Match Modes & Rulesets",
	architecture: "Queue Architecture",
};

export default function Page() {
	const {
		meta,
		queues: dbQueues,
		isLoading,
		isSaving,
		saveMetaSection,
		saveQueues,
	} = useGuildConfig();

	const { channels, categoryOptions, threads } = useGuildSnapshot();

	const [activeTab, setActiveTab] = useState<TabVariant>("modes");
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Local state mirrors (editable copies)
	const [gameModes, setGameModes] = useState<ModeConfig[]>([]);
	const [categories, setCategories] = useState<QueueConfig[]>([]);

	// Sync from DB data when it loads
	useEffect(() => {
		if (meta?.modes) setGameModes(meta.modes);
	}, [meta]);

	useEffect(() => {
		if (dbQueues) setCategories(dbQueues);
	}, [dbQueues]);

	// ── Saved snapshots (per-tab) ─────────────────────────────────────────
	const savedModes = useMemo(() => meta?.modes ?? null, [meta]);
	const savedCategories = useMemo(() => dbQueues ?? null, [dbQueues]);

	// ── Global unsaved changes (drives SaveBar + nav guard) ───────────────
	const globalLocal = useMemo(
		() => ({ gameModes, categories }),
		[gameModes, categories],
	);
	const globalSaved = useMemo(() => {
		if (!meta && !dbQueues?.length) return null;
		return { gameModes: meta?.modes ?? [], categories: dbQueues ?? [] };
	}, [meta, dbQueues]);

	const { isDirty } = useUnsavedChanges(globalLocal, globalSaved);

	// ── Per-tab discard handler ───────────────────────────────────────────
	const handleDiscard = useCallback((discardedTab: TabVariant) => {
		if (discardedTab === "modes" && savedModes) {
			setGameModes(savedModes);
		} else if (discardedTab === "architecture" && savedCategories) {
			setCategories(savedCategories);
		}
	}, [savedModes, savedCategories]);

	// ── Tab guard ─────────────────────────────────────────────────────────
	const tabGuard = useTabGuard<TabVariant>({
		activeTab,
		setActiveTab,
		tabSnapshots: {
			modes:        { local: gameModes,   saved: savedModes },
			architecture: { local: categories,  saved: savedCategories },
		},
		onDiscard: handleDiscard,
	});

	// ── Save ──────────────────────────────────────────────────────────────
	const flashSuccess = () => {
		setSaveSuccess(true);
		setTimeout(() => setSaveSuccess(false), 2500);
	};

	const handleSaveModes = async () => {
		setSaveError(null);
		try {
			await saveMetaSection("modes", gameModes);
			flashSuccess();
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		}
	};

	const handleSaveQueues = async () => {
		setSaveError(null);
		try {
			await saveQueues(categories);
			flashSuccess();
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		}
	};

	const handleSave = () => {
		if (activeTab === "modes") handleSaveModes();
		else handleSaveQueues();
	};

	// ── Mutations ─────────────────────────────────────────────────────────
	const updateMode = (idx: number, updates: Partial<ModeConfig>) => {
		setGameModes((prev) => prev.map((m, i) => (i === idx ? { ...m, ...updates } : m)));
	};

	const handleAddMode = () => {
		setGameModes((prev) => [
			...prev,
			{
				name: "New Custom Mode",
				stable_id: "new_mode",
				type: "classic",
				team_count: 2,
				players_per_team: 4,
				max_players: 8,
				gui_slot: prev.length + 1,
				is_enabled: true,
				is_elo_gain_enabled: true,
				is_stats_tracking_enabled: true,
				is_auto_striking_enabled: true,
				is_party_queue_enabled: false,
				is_queue_category: false,
			},
		]);
	};

	const updateGroup = (idx: number, updates: Partial<QueueConfig>) => {
		setCategories((prev) => prev.map((g, i) => (i === idx ? { ...g, ...updates } : g)));
	};

	const updateSetting = (
		groupIdx: number,
		settingIdx: number,
		updates: Partial<QueueConfig["settings"][0]>,
	) => {
		setCategories((prev) =>
			prev.map((g, gi) =>
				gi === groupIdx
					? { ...g, settings: g.settings.map((s, si) => (si === settingIdx ? { ...s, ...updates } : s)) }
					: g,
			),
		);
	};

	const handleAddGroup = () => {
		setCategories((prev) => [
			...prev,
			{ 
				name: "New Queue Group", 
				category_id: null, 
				waiting_vc_id: null, 
				is_enabled: true, 
				settings: [],
				voice_team_template: "Team {team} - {mode}",
				voice_waiting_template: "Waiting - {mode}",
			},
		]);
	};

	const handleAddSetting = (groupIdx: number) => {
		setCategories((prev) =>
			prev.map((g, gi) =>
				gi === groupIdx
					? {
							...g,
							settings: [
								...g.settings,
								{
									name: "New Voice Listener",
									mode: gameModes[0]?.stable_id ?? "",
									channel_id: "",
									is_enabled: true,
									allowed_ranks: [],
									denied_ranks: [],
								},
							],
					  }
					: g,
			),
		);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin text-primary-500" />
			</div>
		);
	}

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Matchmaker Normalized Engine
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Queue Configuration Studio
					</h2>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && (
						<span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider">
							<CheckCircle2 className="size-3.5" /> Saved
						</span>
					)}
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
						<span>{isSaving ? "Saving..." : "Commit Matrix Layout"}</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			{/* Tabs */}
			<div className="flex border-b border-border-subtle/40 gap-2">
				{(["modes", "architecture"] as const).map((tab) => {
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
							{tab === "modes"
								? <><Trophy className="size-3.5" /> 1. Match Modes &amp; Rulesets</>
								: <><Network className="size-3.5" /> 2. Queue Architecture</>
							}
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

			{/* ── TAB: MODES ── */}
			{activeTab === "modes" && (
				<div className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-6 animate-in fade-in duration-200">
					<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
						<div className="flex items-center gap-2">
							<Trophy className="size-4 text-primary-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">
								Game Modes &amp; Ruleset Interceptors
							</h3>
						</div>
						<button onClick={handleAddMode} className="font-mono text-[10px] font-bold text-primary-500 uppercase tracking-wider hover:underline flex items-center gap-0.5">
							<Plus className="size-3" /> Register Game Mode
						</button>
					</div>

					{gameModes.length === 0 && (
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide border border-dashed border-border-subtle/60 rounded-lg p-4">
							No modes configured — click &ldquo;Register Game Mode&rdquo; to add one.
						</p>
					)}

					<div className="space-y-6">
						{gameModes.map((mode, idx) => (
							<div key={idx} className="p-5 bg-bg-canvas/30 border border-border-subtle rounded-xl space-y-5">
								<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
									<div className="space-y-1">
										<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">Mode Display Label</label>
										<input type="text" value={mode.name} onChange={(e) => updateMode(idx, { name: e.target.value })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
									</div>
									<div className="space-y-1">
										<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">Stable ID</label>
										<input type="text" value={mode.stable_id ?? ""} onChange={(e) => updateMode(idx, { stable_id: e.target.value })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
									</div>
									<div className="space-y-1">
										<label className="block font-mono text-[9px] font-bold text-fg-muted uppercase tracking-wider">Mode Type</label>
										<select value={mode.type} onChange={(e) => updateMode(idx, { type: e.target.value as ModeType })} className="w-full h-8 px-2 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50">
											{MODE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
										</select>
									</div>
									<div className="flex items-end justify-end">
										<button onClick={() => setGameModes(gameModes.filter((_, i) => i !== idx))} className="h-8 px-3 flex items-center justify-center gap-1.5 border border-border-subtle bg-panel-bg/40 hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer">
											<Trash2 className="size-3" /> Remove
										</button>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-border-subtle/30">
									{[
										{ label: "Team Count", field: "team_count" as const },
										{ label: "Players Per Team", field: "players_per_team" as const },
										{ label: "Max Players", field: "max_players" as const },
										{ label: "GUI Slot", field: "gui_slot" as const },
									].map(({ label, field }) => (
										<div key={field} className="space-y-1">
											<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">{label}</label>
											<input type="number" value={mode[field] as number} onChange={(e) => updateMode(idx, { [field]: Number(e.target.value) })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
										</div>
									))}
									<div className="space-y-1">
										<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Settings Preset ID</label>
										<input type="text" value={mode.settings_id ?? ""} onChange={(e) => updateMode(idx, { settings_id: e.target.value ? Number(e.target.value) : undefined })} placeholder="PG preset" className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
									</div>
								</div>

								<div className="space-y-3 pt-4 border-t border-border-subtle/30">
									<span className="block font-mono text-[9px] font-black text-primary-500 uppercase tracking-widest">// Local Ruleset Hooks</span>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
										{[
											{ key: "is_party_queue_enabled" as const, label: "Party Queue Enabled", icon: Users },
											{ key: "is_elo_gain_enabled" as const, label: "Accrue Ladder ELO", icon: Zap },
											{ key: "is_stats_tracking_enabled" as const, label: "Track Performance Stats", icon: Database },
											{ key: "is_auto_striking_enabled" as const, label: "Auto Striking", icon: Zap },
											{ key: "is_enabled" as const, label: "Mode Enabled", icon: Zap },
											{ key: "is_queue_category" as const, label: "Queue Category", icon: Database },
										].map(({ key, label, icon: Icon }) => (
											<div
												key={key}
												onClick={() => updateMode(idx, { [key]: !mode[key] })}
												className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${mode[key] ? "bg-primary-500/5 border-primary-500/20" : "bg-bg-canvas/10 border-border-subtle/50 opacity-60"}`}
											>
												<div className="space-y-0.5">
													<span className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">{label}</span>
												</div>
												<Icon className={`size-3.5 ${mode[key] ? "text-primary-500" : "text-fg-muted"}`} />
											</div>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* ── TAB: QUEUE ARCHITECTURE ── */}
			{activeTab === "architecture" && (
				<div className="space-y-6 animate-in fade-in duration-200">
					<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
						<div className="text-left">
							<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">Queue Group Bindings</h3>
							<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">Bind Discord categories and voice channels to matchmaking queue listeners</p>
						</div>
						<button onClick={handleAddGroup} className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer">
							<Plus className="size-3.5" /> Add Queue Group
						</button>
					</div>

					{categories.length === 0 && (
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide border border-dashed border-border-subtle/60 rounded-lg p-4">
							No queue groups — click &ldquo;Add Queue Group&rdquo; to create one.
						</p>
					)}

					{categories.map((group, gi) => (
						<div key={gi} className="p-5 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-4 shadow-xs">
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b border-border-subtle/40 pb-4">
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Queue Group Name</label>
									<input type="text" value={group.name} onChange={(e) => updateGroup(gi, { name: e.target.value })} className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
								</div>
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Discord Category</label>
									<CategoryDropdown
										value={group.category_id ?? ""}
										onChange={(value) => updateGroup(gi, { category_id: value || null })}
										categoryOptions={categoryOptions}
										placeholder="Select a category"
									/>
								</div>
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Waiting Voice Channel</label>
									<ChannelDropdown
										value={group.waiting_vc_id ?? ""}
										onChange={(value) => updateGroup(gi, { waiting_vc_id: value || null })}
										channels={channels.filter(ch => ch.type === "voice")}
										threads={[]}
										placeholder="Select a voice channel"
									/>
								</div>
								<div className="flex gap-2 justify-end">
									<button onClick={() => updateGroup(gi, { is_enabled: !group.is_enabled })} className={`h-9 px-4 border rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${group.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
										{group.is_enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
										{group.is_enabled ? "Active" : "Disabled"}
									</button>
									<button onClick={() => setCategories(categories.filter((_, i) => i !== gi))} className="size-9 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-lg transition-all cursor-pointer">
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>

							{/* Voice Channel Name Templates */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-b border-border-subtle/20 pb-4">
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Team Voice Channel Template</label>
									<input 
										type="text" 
										value={group.voice_team_template ?? ""} 
										onChange={(e) => updateGroup(gi, { voice_team_template: e.target.value || null })}
										placeholder="Team {team} - {mode}"
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" 
									/>
									<span className="block font-mono text-[8px] text-fg-muted uppercase tracking-wide">Variables: {`{team}`}, {`{mode}`}, {`{rank}`}</span>
								</div>
								<div className="space-y-1.5">
									<label className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Waiting Voice Channel Template</label>
									<input 
										type="text" 
										value={group.voice_waiting_template ?? ""} 
										onChange={(e) => updateGroup(gi, { voice_waiting_template: e.target.value || null })}
										placeholder="Waiting - {mode}"
										className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" 
									/>
									<span className="block font-mono text-[8px] text-fg-muted uppercase tracking-wide">Variables: {`{mode}`}, {`{rank}`}</span>
								</div>
							</div>

							<div className="space-y-2.5">
								<div className="flex justify-between items-center px-1">
									<span className="font-mono text-[10px] font-bold text-fg-muted uppercase tracking-widest">// Queue Listener Channels</span>
									<button onClick={() => handleAddSetting(gi)} className="font-mono text-[9px] font-bold text-primary-500 uppercase tracking-wider hover:underline flex items-center gap-0.5">
										<Plus className="size-2.5" /> Append Listener
									</button>
								</div>

								{group.settings.length === 0 && (
									<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide border border-dashed border-border-subtle/60 rounded-lg p-3">
										No listeners bound — append a voice channel listener.
									</p>
								)}

								<div className="space-y-2">
									{group.settings.map((setting, si) => (
										<div key={si} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl border border-border-subtle/50 bg-bg-canvas/20 items-end">
											<div className="sm:col-span-3 space-y-1">
												<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Listener Name</label>
												<input type="text" value={setting.name ?? ""} onChange={(e) => updateSetting(gi, si, { name: e.target.value })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-[11px] text-fg-default focus:outline-none focus:border-primary-500/50" />
											</div>
											<div className="sm:col-span-3 space-y-1">
												<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Channel</label>
												<ChannelDropdown
													value={setting.channel_id}
													onChange={(value) => updateSetting(gi, si, { channel_id: value })}
													channels={channels}
													threads={threads}
													placeholder="Select a channel"
												/>
											</div>
											<div className="sm:col-span-3 space-y-1">
												<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Bound Mode</label>
												<select value={setting.mode} onChange={(e) => updateSetting(gi, si, { mode: e.target.value })} className="w-full h-8 px-2 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-[11px] text-fg-default focus:outline-none focus:border-primary-500/50">
													{gameModes.map((m, mi) => <option key={mi} value={m.stable_id ?? m.name}>{m.name}</option>)}
												</select>
											</div>
											<div className="sm:col-span-2 flex items-end gap-2">
												<button onClick={() => updateSetting(gi, si, { is_enabled: !setting.is_enabled })} className={`h-8 flex-1 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${setting.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
													{setting.is_enabled ? <ToggleRight className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
													{setting.is_enabled ? "On" : "Off"}
												</button>
												<button onClick={() => updateGroup(gi, { settings: group.settings.filter((_, i) => i !== si) })} className="size-8 flex items-center justify-center border border-border-subtle rounded-md text-fg-muted hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer shrink-0">
													<Trash2 className="size-3" />
												</button>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Voice Channel Name Templates */}
							<div className="pt-4 border-t border-border-subtle/30 space-y-3">
								<div className="flex justify-between items-center px-1">
									<span className="font-mono text-[10px] font-bold text-fg-muted uppercase tracking-widest">// Voice Channel Name Templates</span>
								</div>
								<div className="space-y-2">
									<div className="space-y-1">
										<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Team Voice Channel Template</label>
										<input 
											type="text" 
											value={(group as any).voice_team_template ?? "Match #{match_id} - Team {team_color}"} 
											onChange={(e) => updateGroup(gi, { voice_team_template: e.target.value || null } as any)} 
											placeholder="Match #{match_id} - Team {team_color}"
											className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" 
										/>
										<span className="block font-mono text-[8px] text-fg-muted uppercase tracking-wide">Variables: {'{match_id}'}, {'{team_color}'}, {'{mode_name}'}</span>
									</div>
									<div className="space-y-1">
										<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Waiting Room Template</label>
										<input 
											type="text" 
											value={(group as any).voice_waiting_template ?? "Waiting - {mode_name}"} 
											onChange={(e) => updateGroup(gi, { voice_waiting_template: e.target.value || null } as any)} 
											placeholder="Waiting - {mode_name}"
											className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" 
										/>
										<span className="block font-mono text-[8px] text-fg-muted uppercase tracking-wide">Variables: {"{mode_name}"}, {"{queue_name}"}</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
