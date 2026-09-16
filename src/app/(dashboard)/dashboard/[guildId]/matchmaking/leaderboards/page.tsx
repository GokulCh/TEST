"use client";

import {
	AlertCircle,
	Calendar,
	CheckCircle2,
	Flame,
	Loader2,
	Plus,
	Save,
	ToggleLeft,
	ToggleRight,
	Trash2,
	Volume2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import RoleDropdown from "@/components/ui/RoleDropdown";
import type { LeaderboardDisplayConfig } from "@/lib/db-types";

const METRICS: Array<{ value: LeaderboardDisplayConfig["metric"]; label: string }> = [
	{ value: "elo", label: "ELO Rating" },
	{ value: "wins", label: "Wins Count" },
	{ value: "highest_streak", label: "Highest Streak" },
	{ value: "kills", label: "Kills Count" },
	{ value: "final_kills", label: "Final Kills" },
	{ value: "beds_destroyed", label: "Beds Destroyed" },
	{ value: "mvp_count", label: "MVP Count" },
];

export default function Page() {
	const { dbGuildId } = useGuildConfig();
	const { roleOptions } = useGuildSnapshot();

	const [boards, setBoards] = useState<LeaderboardDisplayConfig[]>([]);
	const [savedBoards, setSavedBoards] = useState<LeaderboardDisplayConfig[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [webhooksEnabled, setWebhooksEnabled] = useState(true);

	const load = useCallback(async () => {
		if (!dbGuildId) return;
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/panel-config`);
			if (!res.ok) throw new Error(`${res.status}`);
			const data = await res.json();
			const cfg = data.data;
			setBoards(cfg?.leaderboards ?? []);
			setSavedBoards(cfg?.leaderboards ?? []);
		} catch {
			// silently fall through to empty state
		} finally {
			setLoading(false);
		}
	}, [dbGuildId]);

	useEffect(() => { load(); }, [load]);

	const globalLocal = useMemo(() => ({ boards }), [boards]);
	const globalSaved = useMemo(
		() => (savedBoards === null ? null : { boards: savedBoards }),
		[savedBoards],
	);
	useUnsavedChanges(globalLocal, globalSaved);

	const flashSuccess = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); };

	const handleSave = async () => {
		if (!dbGuildId) return;
		setSaveError(null);
		setIsSaving(true);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/panel-config`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ section: "leaderboards", data: boards }),
			});
			if (!res.ok) {
				const body = await res.json();
				throw new Error(body.error ?? "Save failed");
			}
			setSavedBoards(boards);
			flashSuccess();
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : "Save failed");
		} finally {
			setIsSaving(false);
		}
	};

	const updateBoard = (id: string, updates: Partial<LeaderboardDisplayConfig>) =>
		setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));

	const addBoard = () => {
		const id = `lb-${Date.now()}`;
		setBoards((prev) => [...prev, { id, name: "New Stats Metric", metric: "elo", reward_role_id: "", is_enabled: true }]);
	};

	if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-primary-500" /></div>;

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Stats Registry Boards (guild_panel_configs.leaderboards)</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Global Leaderboards</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && <span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider"><CheckCircle2 className="size-3.5" /> Saved</span>}
					<button onClick={handleSave} disabled={isSaving || !dbGuildId} className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60">
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>{isSaving ? "Writing..." : "Commit Leaderboards"}</span>
					</button>
				</div>
			</div>

			{saveError && <div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger"><AlertCircle className="size-4 shrink-0" /><p className="font-mono text-[10px] uppercase">{saveError}</p></div>}

			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div>
					<h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">Active Registers</h3>
					<p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">Configure competitive score lists shown on the public portal</p>
				</div>
				<button onClick={addBoard} className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all active:scale-98 cursor-pointer">
					<Plus className="size-3.5" /> Add Scoreboard Block
				</button>
			</div>

			{boards.length === 0 && (
				<div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center font-mono text-xs text-fg-muted uppercase tracking-wider">
					No leaderboards configured — click &ldquo;Add Scoreboard Block&rdquo; to create one.
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{boards.map((lb) => (
						<div key={lb.id} className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs">
							<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Board Name</label>
									<input type="text" value={lb.name} onChange={(e) => updateBoard(lb.id, { name: e.target.value })} className="w-full h-8 px-2.5 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Score Metric</label>
									<select value={lb.metric} onChange={(e) => updateBoard(lb.id, { metric: e.target.value as LeaderboardDisplayConfig["metric"] })} className="w-full h-8 px-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
										{METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
									</select>
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Reward Role</label>
									<RoleDropdown
										value={lb.reward_role_id}
										onChange={(value) => updateBoard(lb.id, { reward_role_id: value })}
										roles={roleOptions}
										placeholder="Select reward role"
									/>
								</div>
								<div className="flex gap-2 justify-end sm:justify-start">
									<button onClick={() => updateBoard(lb.id, { is_enabled: !lb.is_enabled })} className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${lb.is_enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
										{lb.is_enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
										{lb.is_enabled ? "Live" : "Muted"}
									</button>
									<button onClick={() => setBoards(boards.filter((b) => b.id !== lb.id))} className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md cursor-pointer">
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Volume2 className="size-4 text-cyan-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Auto Webhooks</h3>
						</div>
						<div className="flex items-center justify-between p-3 rounded-lg border border-border-subtle/40 bg-bg-canvas/30">
							<div className="space-y-0.5 text-left">
								<span className="block font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider">Broadcast Top-10</span>
								<span className="font-mono text-[8px] text-fg-muted uppercase tracking-wide">Spit out leaderboard summaries on resets.</span>
							</div>
							<button onClick={() => setWebhooksEnabled(!webhooksEnabled)} className={`h-7 px-3 font-mono text-[9px] font-bold uppercase tracking-wider rounded-md border cursor-pointer ${webhooksEnabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
								{webhooksEnabled ? "ON" : "OFF"}
							</button>
						</div>
					</div>

					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Calendar className="size-4 text-amber-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">System Resets</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Stat rows are keyed by season_key per guild and archived when a season ends in the season registry.
						</p>
					</div>

					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-xs">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5">
							<Flame className="size-4 text-rose-500" />
							<h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Storage</h3>
						</div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">
							Leaderboard display config is stored in <code className="text-primary-400">guild_panel_configs.leaderboards</code> — separate from match engine data.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
