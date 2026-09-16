"use client";

import {
	AlertCircle, AlertTriangle, CheckCircle2, History, Info, Loader2, Plus, Save, ToggleLeft, ToggleRight, Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { StrikeLadderConfig, StrikeLadderLevel, StrikeLadderStep } from "@/lib/db-types";
import RoleDropdown from "@/components/ui/RoleDropdown";
import OptionDropdown from "@/components/ui/OptionDropdown";

type DurationUnit = "minutes" | "hours" | "days";
interface UIStep extends StrikeLadderStep { _key: string; }
interface UILevel extends Omit<StrikeLadderLevel, "steps"> { _key: string; steps: UIStep[]; }

const STRIKE_ACTIONS = ["warning", "queue_restriction", "server_ban", "elo_removal", "debuff", "disqualify"];

function toUI(cfg: StrikeLadderConfig): UILevel[] {
	return Object.entries(cfg.levels ?? {}).map(([k, lv]) => ({
		...lv, _key: k,
		steps: (lv.steps ?? []).map((s, i) => ({ ...s, _key: `${k}-${i}` })),
	}));
}

function fromUI(levels: UILevel[]): Record<string, StrikeLadderLevel> {
	const out: Record<string, StrikeLadderLevel> = {};
	levels.forEach(({ _key, steps, ...rest }) => {
		out[_key] = { ...rest, steps: steps.map(({ _key: _k, ...s }) => s) };
	});
	return out;
}

export default function Page() {
	const { config, isLoading, isSaving, saveConfigSection } = useGuildConfig();
	const { roleOptions } = useGuildSnapshot();
	const [decayDays, setDecayDays] = useState(0);
	const [offenceMode, setOffenceMode] = useState<"persistent" | "active_only" | "season_reset">("persistent");
	const [levels, setLevels] = useState<UILevel[]>([]);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		const cfg = config?.strike_ladder;
		if (!cfg) return;
		setDecayDays(cfg.decay_interval_days ?? 0);
		setOffenceMode(cfg.offence_mode ?? "persistent");
		setLevels(toUI(cfg));
	}, [config]);

	const globalLocal = useMemo(() => ({ decayDays, offenceMode, levels }), [decayDays, offenceMode, levels]);
	const globalSaved = useMemo(() => {
		const cfg = config?.strike_ladder;
		if (!cfg) return null;
		return { decayDays: cfg.decay_interval_days ?? 0, offenceMode: cfg.offence_mode ?? "persistent", levels: toUI(cfg) };
	}, [config]);
	useUnsavedChanges(globalLocal, globalSaved);

	const flashSuccess = () => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2500); };

	const handleSave = async () => {
		setSaveError(null);
		try {
			await saveConfigSection("strike-ladder", { decay_interval_days: decayDays, offence_mode: offenceMode, levels: fromUI(levels) });
			flashSuccess();
		} catch (e) { setSaveError(e instanceof Error ? e.message : "Save failed"); }
	};

	const updateLevel = (key: string, up: Partial<UILevel>) => setLevels((p) => p.map((l) => l._key === key ? { ...l, ...up } : l));
	const updateStep = (lk: string, sk: string, up: Partial<UIStep>) =>
		setLevels((p) => p.map((l) => l._key === lk ? { ...l, steps: l.steps.map((s) => s._key === sk ? { ...s, ...up } : s) } : l));
	const addLevel = () => { const k = `level-${Date.now()}`; setLevels((p) => [...p, { _key: k, id: k, name: "New Offence Category", description: null, enabled: true, steps: [] }]); };
	const addStep = (lk: string) => {
		setLevels((p) => p.map((l) => l._key === lk ? { ...l, steps: [...l.steps, { _key: `${lk}-${Date.now()}`, strikes_required: l.steps.length + 1, weight: 1, action: "warning", duration: 0, durationUnit: "days", elo_removal: 0, ban_days: 0, restriction_role_id: "", debuff_days: 0, disqualify_days: 0 }] } : l));
	};

	if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="size-6 animate-spin text-primary-500" /></div>;

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Strike escalation rules</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Strike Auto-Ladder</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					{saveSuccess && <span className="flex items-center gap-1.5 font-mono text-[10px] text-success uppercase tracking-wider"><CheckCircle2 className="size-3.5" /> Saved</span>}
					<button onClick={handleSave} disabled={isSaving} className="h-9 px-4 flex items-center gap-2 border border-primary-500/20 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-60">
						{isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
						<span>{isSaving ? "Syncing..." : "Commit Escalation Logic"}</span>
					</button>
				</div>
			</div>

			{saveError && <div className="flex items-center gap-3 p-3 rounded-lg border border-danger/30 bg-danger/10 text-danger"><AlertCircle className="size-4 shrink-0" /><p className="font-mono text-[10px] uppercase">{saveError}</p></div>}

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-1.5 shadow-xs">
					<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Strike Decay Interval (Days)</label>
					<input type="number" value={decayDays} onChange={(e) => setDecayDays(Number(e.target.value) || 0)} className="w-full h-9 px-3 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
					<span className="block font-mono text-[8px] text-fg-muted uppercase tracking-wide">0 disables decay.</span>
				</div>
				<div className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-1.5 shadow-xs">
					<label className="block font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider">Offence Accounting Mode</label>
<OptionDropdown value={offenceMode} onChange={(value) => setOffenceMode(value as typeof offenceMode)} options={[{ value: "persistent", label: "Persistent (Lifetime)" }, { value: "active_only", label: "Active Only" }, { value: "season_reset", label: "Season Reset" }]} />
				</div>
			</div>

			<div className="flex justify-between items-center bg-panel-bg/10 p-4 border border-border-subtle rounded-xl">
				<div><h3 className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">Strike levels</h3><p className="font-mono text-[9px] text-fg-muted uppercase mt-0.5">Each offence category owns an escalation vector of strike thresholds</p></div>
				<button onClick={addLevel} className="h-8 px-3 flex items-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer"><Plus className="size-3.5" /> Append Ladder Level</button>
			</div>

			{levels.length === 0 && <div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center font-mono text-xs text-fg-muted uppercase tracking-wider">No levels — click &ldquo;Append Ladder Level&rdquo; to add one.</div>}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{levels.map((level) => (
						<div key={level._key} className="p-4 border border-border-subtle bg-panel-bg/20 rounded-xl space-y-3 shadow-xs">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/20">
								<div className="space-y-0.5">
									<div className="flex items-center gap-2">
										<AlertTriangle className="size-3.5 text-amber-500" />
										<input type="text" value={level.name} onChange={(e) => updateLevel(level._key, { name: e.target.value })} className="font-mono text-xs font-black text-fg-default uppercase bg-transparent border-b border-transparent hover:border-border-subtle focus:border-primary-500/50 focus:outline-none px-1" />
									</div>
									<input type="text" value={level.description ?? ""} onChange={(e) => updateLevel(level._key, { description: e.target.value })} placeholder="Description..." className="font-mono text-[9px] text-fg-muted uppercase bg-transparent focus:outline-none w-full pl-5" />
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<button onClick={() => updateLevel(level._key, { enabled: !level.enabled })} className={`h-8 px-3 border rounded-md font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${level.enabled ? "bg-success/10 border-success/30 text-success" : "bg-panel-bg border-border-subtle text-fg-muted"}`}>
										{level.enabled ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}{level.enabled ? "Active" : "Disabled"}
									</button>
									<button onClick={() => setLevels(levels.filter((l) => l._key !== level._key))} className="size-8 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md cursor-pointer"><Trash2 className="size-3.5" /></button>
								</div>
							</div>

							<div className="space-y-2">
								{level.steps.map((step) => (
									<div key={step._key} className="p-3 rounded-lg border border-border-subtle/50 bg-bg-canvas/20 space-y-3">
										<div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
											<div className="space-y-1"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Strikes Req.</label><input type="number" value={step.strikes_required} onChange={(e) => updateStep(level._key, step._key, { strikes_required: Number(e.target.value) })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none" /></div>
											<div className="space-y-1 sm:col-span-2"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Action</label>
												<select value={step.action} onChange={(e) => updateStep(level._key, step._key, { action: e.target.value })} className="w-full h-8 px-2 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
													{STRIKE_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
												</select>
											</div>
											<div className="space-y-1"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Duration</label><input type="number" value={step.duration ?? 0} onChange={(e) => updateStep(level._key, step._key, { duration: Number(e.target.value) })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none" /></div>
											<div className="space-y-1"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Unit</label>
												<select value={(step as { durationUnit?: string }).durationUnit ?? "days"} onChange={(e) => updateStep(level._key, step._key, { durationUnit: e.target.value } as Partial<UIStep>)} className="w-full h-8 px-2 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
													<option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option>
												</select>
											</div>
										</div>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
											{[["ELO Removal", "elo_removal"], ["Ban Days", "ban_days"], ["Debuff Days", "debuff_days"], ["Disq. Days", "disqualify_days"]] .map(([label, field]) => (
												<div key={field} className="space-y-1"><label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">{label}</label><input type="number" value={(step as unknown as Record<string, unknown>)[field] as number ?? 0} onChange={(e) => updateStep(level._key, step._key, { [field]: Number(e.target.value) })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none" /></div>
											))}
										</div>
										<div className="flex items-center gap-2">
											<RoleDropdown
												value={step.restriction_role_id ?? ""}
												onChange={(value) => updateStep(level._key, step._key, { restriction_role_id: value })}
												roles={roleOptions}
												placeholder="Restriction Role"
												className="flex-1"
											/>
											<button onClick={() => updateLevel(level._key, { steps: level.steps.filter((s) => s._key !== step._key) })} className="size-7 flex items-center justify-center border border-border-subtle hover:bg-red-500/10 text-fg-muted hover:text-red-400 rounded-md cursor-pointer"><Trash2 className="size-3" /></button>
										</div>
									</div>
								))}
								<button onClick={() => addStep(level._key)} className="w-full h-8 flex items-center justify-center gap-1.5 border border-dashed border-primary-500/30 text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"><Plus className="size-3" /> Append Escalation Step</button>
							</div>
						</div>
					))}
				</div>
				<div className="space-y-6">
					<div className="p-5 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 h-fit">
						<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2.5"><History className="size-4 text-cyan-500" /><h3 className="font-mono text-[11px] font-bold text-fg-default uppercase tracking-widest">Strike Accounting</h3></div>
						<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed text-left">Steps trigger the moment a player crosses the configured strike threshold.</p>
					</div>
					<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl space-y-2">
						<div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-fg-default uppercase tracking-wider"><Info className="size-3.5 text-primary-500" /><span>Decay Operations</span></div>
						<p className="font-mono text-[9px] text-fg-muted uppercase leading-normal text-left">Setting decay to 0 disables automated strike expiry.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
