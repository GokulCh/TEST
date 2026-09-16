"use client";

import {
	AlertCircle,
	CalendarDays,
	CheckCircle2,
	History,
	Loader2,
	Plus,
	Save,
	Sparkles,
	ToggleLeft,
	ToggleRight,
	Trash2,
	TrendingDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { SeasonConfig, EloEngineConfig } from "@/lib/db-types";
import { DatePicker } from "@/components/ui/DatePicker";

export default function Page() {
	const { meta, config, isLoading, isSaving, saveMetaSection, saveConfigSection } = useGuildConfig();
	const [seasons, setSeasons] = useState<SeasonConfig[]>([]);
	const [decay, setDecay] = useState({ enabled: false, decayFloor: 0, inactivityDays: 0 });
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// Saved state for unsaved changes detection
	const [savedSeasons, setSavedSeasons] = useState<SeasonConfig[]>([]);
	const [savedDecay, setSavedDecay] = useState({ enabled: false, decayFloor: 0, inactivityDays: 0 });

	// Sync from real DB
	useEffect(() => {
		if (meta?.seasons) {
			const arr = Object.values(meta.seasons).sort((a, b) => b.id - a.id);
			setSeasons(arr);
			setSavedSeasons(arr);
		}
	}, [meta]);

	useEffect(() => {
		const d = config?.elo_engine?.elo_decay;
		if (d) {
			const decayConfig = { enabled: d.enabled, decayFloor: d.decayFloor, inactivityDays: d.inactivityDays };
			setDecay(decayConfig);
			setSavedDecay(decayConfig);
		}
	}, [config]);

	const nextId = seasons.length > 0 ? Math.max(...seasons.map((s) => s.id)) + 1 : 1;

	// Global unsaved changes detection
	const globalLocal = useMemo(() => ({
		seasons,
		decay,
	}), [seasons, decay]);

	const globalSaved = useMemo(() => ({
		seasons: savedSeasons,
		decay: savedDecay,
	}), [savedSeasons, savedDecay]);

	const { isDirty } = useUnsavedChanges(globalLocal, globalSaved);

	const updateSeason = (id: number, updates: Partial<SeasonConfig>) =>
		setSeasons((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));

	const flashSuccess = () => {
		setSaveSuccess(true);
		setTimeout(() => setSaveSuccess(false), 2500);
	};

	const handleSave = async () => {
		setSaveError(null);
		try {
			const eloEngine: EloEngineConfig = {
				...(config?.elo_engine ?? {}),
				elo_decay: { enabled: decay.enabled, decayFloor: decay.decayFloor, inactivityDays: decay.inactivityDays },
			};
			await Promise.all([saveMetaSection("seasons", seasons), saveConfigSection("elo-engine", eloEngine)]);
			flashSuccess();
			// Update saved state after successful save
			setSavedSeasons(seasons);
			setSavedDecay(decay);
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		}
	};

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64">
				<Loader2 className="size-6 animate-spin text-primary-500" />
			</div>
		);

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Infrastructure Timeline Control</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Season Breaks & Rotations</h2>
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
						<span>{isSaving ? "Saving..." : "Commit Seasonal Rules"}</span>
					</button>
				</div>
			</div>

			{saveError && (
				<div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger">
					<AlertCircle className="size-4 shrink-0" />
					<p className="font-mono text-[10px] uppercase">{saveError}</p>
				</div>
			)}

			{/* ELO Decay card */}
			<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-sm">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="space-y-1 text-left">
						<h3 className="flex items-center gap-2 font-mono text-xs font-black text-fg-default uppercase tracking-wide">
							<TrendingDown className="size-4 text-amber-500" />
							Automated ELO Decay Engine
						</h3>
						<p className="font-mono text-[9px] text-fg-muted uppercase max-w-xl leading-relaxed">
							Reduces ELO for inactive accounts. Decay stops at the configured floor and only starts after the inactivity window.
						</p>
					</div>
					<button
						onClick={() => setDecay((d) => ({ ...d, enabled: !d.enabled }))}
						className={`h-9 px-4 border rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${decay.enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}
					>
						{decay.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
						{decay.enabled ? "Decay Active" : "Decay Paused"}
					</button>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
					<div className="space-y-1.5">
						<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Decay Floor (Min ELO)</label>
						<input
							type="number"
							value={decay.decayFloor}
							onChange={(e) => setDecay((d) => ({ ...d, decayFloor: Number(e.target.value) }))}
							className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Inactivity Window (Days)</label>
						<input
							type="number"
							value={decay.inactivityDays}
							onChange={(e) => setDecay((d) => ({ ...d, inactivityDays: Number(e.target.value) }))}
							className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
						/>
					</div>
				</div>
			</div>

			{/* Season registry */}
			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">Season Registry</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">Override the active ranked rotation window and schedule future seasons</p>
				</div>
				<button
					onClick={() =>
						setSeasons((prev) => [
							...prev,
							{ id: nextId, name: `Season ${nextId}: New Rotation`, description: "", start_date: new Date().toISOString().slice(0, 10), end_date: "", is_enabled: false },
						])
					}
					className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
				>
					<Plus className="size-3.5" /> Add Season
				</button>
			</div>

			{seasons.length === 0 && (
				<div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center font-mono text-xs text-fg-muted uppercase tracking-wider">
					No seasons configured — click &ldquo;Add Season&rdquo; to create one.
				</div>
			)}

				{seasons.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-4">
					{seasons.map((s) => (
						<div key={s.id} className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs">
							<div className="flex justify-between items-center border-b border-border-subtle/20 pb-2">
								<div className="flex items-center gap-2">
									<CalendarDays className="size-3.5 text-primary-500" />
									<span className="font-mono text-[10px] font-black text-fg-default uppercase tracking-wide">Season #{s.id}</span>
								</div>
								<div className="flex items-center gap-2">
									<span className={`font-mono text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${s.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
										{s.is_enabled ? "Active" : "Archived"}
									</span>
									<button onClick={() => setSeasons((prev) => prev.filter((x) => x.id !== s.id))} className="size-7 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md cursor-pointer">
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Season Name</label>
									<input type="text" value={s.name} onChange={(e) => updateSeason(s.id, { name: e.target.value })} className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none" />
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Start Date</label>
									<DatePicker value={s.start_date?.slice(0, 10) ?? ""} onChange={(value) => updateSeason(s.id, { start_date: value })} placeholder="Select start date" />
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">End Date</label>
									<DatePicker value={(s.end_date ?? "").slice(0, 10)} onChange={(value) => updateSeason(s.id, { end_date: value })} placeholder="Select end date" />
								</div>
							</div>

							<div className="space-y-1">
								<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Description</label>
								<input type="text" value={s.description ?? ""} onChange={(e) => updateSeason(s.id, { description: e.target.value })} className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none" />
							</div>

							<div className="flex items-center justify-between pt-1 border-t border-border-subtle/10">
								<span className="font-mono text-[9px] text-fg-muted uppercase tracking-wider">Season State</span>
								<button onClick={() => updateSeason(s.id, { is_enabled: !s.is_enabled })} className={`h-7 px-2.5 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${s.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
									{s.is_enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
									{s.is_enabled ? "Active" : "Archived"}
								</button>
							</div>
						</div>
					))}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Sparkles className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Season Rewards</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Discord roles and badges are distributed automatically to top leaderboard entries when a season boundary closes.
						</p>
					</div>
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<History className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Archive Registry</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Archived seasons keep leaderboard snapshots and stats queryable via season-scoped player lookups.
						</p>
					</div>
				</div>
				</div>
				}
			</div>
		);
	}
