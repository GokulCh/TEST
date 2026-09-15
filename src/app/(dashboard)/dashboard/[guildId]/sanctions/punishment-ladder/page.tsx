"use client";

import {
	AlertCircle, CheckCircle2, Gavel, Loader2, Plus, Save, Scale, ShieldAlert, ToggleLeft, ToggleRight, Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import type { PunishmentLadderConfig, PunishmentLadderLevel } from "@/lib/db-types";

type DurationUnit = "minutes" | "hours" | "days";
const PUNISHMENT_TYPES = ["warning", "chat_mute", "vc_mute", "queue_ban", "server_ban", "strike_tag"];

interface UIStep { _key: string; type: string; duration: number; durationUnit: DurationUnit; }
interface UILevel extends Omit<PunishmentLadderLevel, "steps"> { _key: string; steps: UIStep[]; }

function toUI(cfg: PunishmentLadderConfig): UILevel[] {
	return Object.entries(cfg.levels ?? {}).map(([k, lv]) => ({
		...lv, _key: k,
		steps: (lv.steps ?? []).map((s: Record<string, unknown>, i: number) => ({
			_key: `${k}-${i}`,
			type: (s.type as string) ?? "warning",
			duration: (s.duration as number) ?? 0,
			durationUnit: (s.durationUnit as DurationUnit) ?? "days",
		})),
	}));
}

function fromUI(levels: UILevel[]): Record<string, PunishmentLadderLevel> {
	const out: Record<string, PunishmentLadderLevel> = {};
	levels.forEach(({ _key, steps, ...rest }) => {
		out[_key] = { ...rest, steps: steps.map(({ _key: _, ...s }) => s) as PunishmentLadderLevel["steps"] };
	});
	return out;
}

export default function Page() {
	const { config, isLoading, isSaving, saveConfigSection } = useGuildConfig();
	const [offenceMode, setOffenceMode] = useState<"persistent" | "active_only" | "season_reset">("persistent");
	const [levels, setLevels] = useState<UILevel[]>([]);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		const cfg = config?.punishment_ladder;
		if (!cfg) return;
		setOffenceMode(cfg.offence_mode ?? "persistent");
		setLevels(toUI(cfg));
	}, [config]);

	const flashSuccess = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); };
	const handleSave = async () => {
		setSaveError(null);
		try { await saveConfigSection("punishment-ladder", { offence_mode: offenceMode, levels: fromUI(levels) }); flashSuccess(); }
		catch (e) { setSaveError(e instanceof Error ? e.message : "Save failed"); }
	};

	const updateLevel = (k: string, up: Partial<UILevel>) => setLevels((p) => p.map((l) => l._key === k ? { ...l, ...up } : l));
	const updateStep = (lk: string, sk: string, up: Partial<UIStep>) =>
		setLevels((p) => p.map((l) => l._key === lk ? { ...l, steps: l.steps.map((s) => s._key === sk ? { ...s, ...up } : s) } : l));
	const addLevel = () => { const k = `level-${Date.now()}`; setLevels((p) => [...p, { _key: k, id: k, punishmentType: "warning", name: "New Category", description: null, enabled: true, steps: [] }]); };

	if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-primary-500" /></div>;

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Sanctions Enforcement Settings</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Enforcement Rules</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && <span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider"><CheckCircle2 className="size-3.5" /> Saved</span>}
					<button onClick={handleSave} disabled={isSaving} className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60">
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>{isSaving ? "Syncing..." : "Commit Enforcement Rules"}</span>
					</button>
				</div>
			</div>

			{saveError && <div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger"><AlertCircle className="size-4 shrink-0" /><p className="font-mono text-[10px] uppercase">{saveError}</p></div>}

			<div className="p-4 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-1.5 shadow-xs">
				<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Offence Accounting Mode</label>
				<select value={offenceMode} onChange={(e) => setOffenceMode(e.target.value as typeof offenceMode)} className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50">
					<option value="persistent">Persistent (Lifetime)</option>
					<option value="active_only">Active Only</option>
					<option value="season_reset">Season Reset</option>
				</select>
			</div>

			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div><h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">Punishment Ladder Registry</h3><p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">Each offence category escalates through ordered enforcement steps</p></div>
				<button onClick={addLevel} className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"><Plus className="size-3.5" /> Append Ladder Level</button>
			</div>

			{levels.length === 0 && <div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center font-mono text-xs text-fg-muted uppercase tracking-wider">No levels — click &ldquo;Append Ladder Level&rdquo; to add one.</div>}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{levels.map((level) => (
						<div key={level._key} className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/20">
								<div className="flex items-center gap-2"><Gavel className="size-3.5 text-cyan-500" /><input type="text" value={level.name} onChange={(e) => updateLevel(level._key, { name: e.target.value })} className="font-mono text-xs font-black text-fg-default uppercase bg-transparent border-b border-transparent hover:border-border-subtle focus:border-primary-500/50 focus:outline-none px-1" /></div>
								<div className="flex items-center gap-2 shrink-0">
									<button onClick={() => updateLevel(level._key, { enabled: !level.enabled })} className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${level.enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
										{level.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}{level.enabled ? "Active" : "Disabled"}
									</button>
									<button onClick={() => setLevels(levels.filter((l) => l._key !== level._key))} className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md cursor-pointer"><Trash2 className="size-3.5" /></button>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Offence Type</label>
									<select value={(level as unknown as Record<string, unknown>).punishmentType as string ?? "warning"} onChange={(e) => updateLevel(level._key, { punishmentType: e.target.value } as Partial<UILevel>)} className="w-full h-8 px-2 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
										{PUNISHMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
									</select>
								</div>
								<div className="space-y-1"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Description</label><input type="text" value={level.description ?? ""} onChange={(e) => updateLevel(level._key, { description: e.target.value })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none" /></div>
							</div>

							<div className="space-y-2">
								{level.steps.map((step) => (
									<div key={step._key} className="p-3 rounded-lg border border-border-subtle/50 bg-bg-canvas/20 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
										<div className="space-y-1 sm:col-span-2"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Action Type</label>
											<select value={step.type} onChange={(e) => updateStep(level._key, step._key, { type: e.target.value })} className="w-full h-8 px-2 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
												{PUNISHMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
											</select>
										</div>
										<div className="space-y-1"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Duration</label><input type="number" value={step.duration} onChange={(e) => updateStep(level._key, step._key, { duration: Number(e.target.value) })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none" /></div>
										<div className="space-y-1 flex items-end gap-1">
											<div className="flex-1 space-y-1"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Unit</label>
												<select value={step.durationUnit} onChange={(e) => updateStep(level._key, step._key, { durationUnit: e.target.value as DurationUnit })} className="w-full h-8 px-2 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
													<option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option>
												</select>
											</div>
											<button onClick={() => updateLevel(level._key, { steps: level.steps.filter((s) => s._key !== step._key) })} className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md cursor-pointer"><Trash2 className="size-3" /></button>
										</div>
									</div>
								))}
								<button onClick={() => updateLevel(level._key, { steps: [...level.steps, { _key: `${level._key}-${Date.now()}`, type: "warning", duration: 0, durationUnit: "days" }] })} className="w-full h-8 flex items-center justify-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"><Plus className="size-3" /> Append Escalation Step</button>
							</div>
						</div>
					))}
				</div>
				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5"><ShieldAlert className="size-4 text-rose-500" /><h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Enforcement Pipeline</h3></div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">Steps apply in ascending order. A zero duration produces an immediate, unbounded enforcement.</p>
					</div>
					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider"><Scale className="size-3.5 text-primary-500" /><span>Offence Modes</span></div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal text-left">Persistent tracks lifetime offence history. Active only requires concurrent active strikes before escalation.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
