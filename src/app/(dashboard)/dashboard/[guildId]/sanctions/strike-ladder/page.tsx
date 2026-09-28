"use client";

import { AlertTriangle, History, Info } from "lucide-react";
import { useMemo } from "react";
import { AddButton, DeleteButton, EmptyState, Field, NumberInput, Panel, SectionBar, SelectInput } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import RoleDropdown from "@/components/ui/RoleDropdown";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { AddStepButton, DURATION_UNITS, LadderSidebar, LevelHeader, OffenceModeField, patchByKey, type Keyed, type OffenceMode } from "@/features/sanctions/ladder-parts";
import { useGuildSnapshot } from "@/hooks/useGuildSnapshot";
import { useSectionForm } from "@/hooks/use-section-form";
import type { StrikeLadderConfig, StrikeLadderLevel, StrikeLadderStep } from "@/lib/db-types";

const STRIKE_ACTIONS = ["warning", "queue_restriction", "server_ban", "elo_removal", "debuff", "disqualify"];
const AMOUNT_FIELDS = [
	["ELO Removal", "elo_removal"],
	["Ban Days", "ban_days"],
	["Debuff Days", "debuff_days"],
	["Disq. Days", "disqualify_days"],
] as const;

interface UIStep extends StrikeLadderStep, Keyed {}
interface UILevel extends Omit<StrikeLadderLevel, "steps">, Keyed { steps: UIStep[] }
interface FormValue { decayDays: number; offenceMode: OffenceMode; levels: UILevel[] }

function toUI(cfg: StrikeLadderConfig): UILevel[] {
	return Object.entries(cfg.levels ?? {}).map(([k, lv]) => ({
		...lv,
		_key: k,
		steps: (lv.steps ?? []).map((s, i) => ({ ...s, _key: `${k}-${i}` })),
	}));
}

function fromUI(levels: UILevel[]): Record<string, StrikeLadderLevel> {
	return Object.fromEntries(levels.map(({ _key, steps, ...rest }) => [_key, { ...rest, steps: steps.map(({ _key: _k, ...s }) => s) }]));
}

const newStep = (levelKey: string, count: number): UIStep => ({
	_key: `${levelKey}-${Date.now()}`, strikes_required: count + 1, weight: 1, action: "warning", duration: 0, durationUnit: "days",
	elo_removal: 0, ban_days: 0, restriction_role_id: "", debuff_days: 0, disqualify_days: 0,
});

export default function Page() {
	const { config, isLoading, isSaving, saveConfigSection } = useGuildConfig();
	const { roleOptions } = useGuildSnapshot();

	const saved = useMemo<FormValue | null>(() => {
		const cfg = config?.strike_ladder;
		return cfg ? { decayDays: cfg.decay_interval_days ?? 0, offenceMode: cfg.offence_mode ?? "persistent", levels: toUI(cfg) } : null;
	}, [config]);
	const { value, update, isDirty, submit, justSaved, error } = useSectionForm<FormValue>(saved, { decayDays: 0, offenceMode: "persistent", levels: [] }, (v) =>
		saveConfigSection("strike-ladder", { decay_interval_days: v.decayDays, offence_mode: v.offenceMode, levels: fromUI(v.levels) }),
	);
	const { levels } = value;

	const setLevels = (fn: (l: UILevel[]) => UILevel[]) => update({ levels: fn(levels) });
	const updateLevel = (key: string, patch: Partial<UILevel>) => setLevels((l) => patchByKey(l, key, patch));
	const updateStep = (levelKey: string, stepKey: string, patch: Partial<UIStep>) =>
		setLevels((l) => l.map((lv) => (lv._key === levelKey ? { ...lv, steps: patchByKey(lv.steps, stepKey, patch) } : lv)));
	const addLevel = () => {
		const k = `level-${Date.now()}`;
		setLevels((l) => [...l, { _key: k, id: k, name: "New Offence Category", description: null, enabled: true, steps: [] }]);
	};

	return (
		<PageShell eyebrow="Sanctions" title="Strike Ladder" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} error={error}>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<Panel>
					<Field label="Strike Decay Interval (Days)" hint="0 disables decay.">
						<NumberInput value={value.decayDays} onValueChange={(decayDays) => update({ decayDays })} />
					</Field>
				</Panel>
				<OffenceModeField value={value.offenceMode} onChange={(offenceMode) => update({ offenceMode })} />
			</div>

			<SectionBar title="Strike levels" description="Each offence category owns an escalation vector of strike thresholds" action={<AddButton onClick={addLevel}>Append Ladder Level</AddButton>} />

			{levels.length === 0 && <EmptyState>No levels — click &ldquo;Append Ladder Level&rdquo; to add one.</EmptyState>}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{levels.map((level) => (
						<Panel key={level._key} className="space-y-3">
							<LevelHeader
								icon={<AlertTriangle className="size-3.5 text-amber-500" />}
								name={level.name}
								onName={(name) => updateLevel(level._key, { name })}
								enabled={level.enabled}
								onEnabled={(enabled) => updateLevel(level._key, { enabled })}
								onDelete={() => setLevels((l) => l.filter((x) => x._key !== level._key))}
							>
								<input type="text" value={level.description ?? ""} onChange={(e) => updateLevel(level._key, { description: e.target.value })} placeholder="Description..." className="text-xs text-fg-muted bg-transparent focus:outline-none w-full pl-5" />
							</LevelHeader>

							<div className="space-y-2">
								{level.steps.map((step) => (
									<div key={step._key} className="p-3 rounded-lg border border-border-subtle/50 bg-bg-canvas/20 space-y-3">
										<div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
											<Field label="Strikes Req." mini>
												<NumberInput mini value={step.strikes_required} onValueChange={(strikes_required) => updateStep(level._key, step._key, { strikes_required })} />
											</Field>
											<Field label="Action" mini className="sm:col-span-2">
												<SelectInput mini value={step.action} onValueChange={(action) => updateStep(level._key, step._key, { action })} options={STRIKE_ACTIONS} />
											</Field>
											<Field label="Duration" mini>
												<NumberInput mini value={step.duration ?? 0} onValueChange={(duration) => updateStep(level._key, step._key, { duration })} />
											</Field>
											<Field label="Unit" mini>
												<SelectInput mini value={step.durationUnit ?? "days"} onValueChange={(durationUnit) => updateStep(level._key, step._key, { durationUnit })} options={DURATION_UNITS} />
											</Field>
										</div>
										<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
											{AMOUNT_FIELDS.map(([label, field]) => (
												<Field key={field} label={label} mini>
													<NumberInput mini value={step[field] ?? 0} onValueChange={(n) => updateStep(level._key, step._key, { [field]: n })} />
												</Field>
											))}
										</div>
										<div className="flex items-center gap-2">
											<RoleDropdown
												value={step.restriction_role_id ?? ""}
												onChange={(restriction_role_id) => updateStep(level._key, step._key, { restriction_role_id })}
												roles={roleOptions}
												placeholder="Restriction Role"
												className="flex-1"
											/>
											<DeleteButton onClick={() => updateLevel(level._key, { steps: level.steps.filter((s) => s._key !== step._key) })} className="size-7 rounded-md" />
										</div>
									</div>
								))}
								<AddStepButton onClick={() => updateLevel(level._key, { steps: [...level.steps, newStep(level._key, level.steps.length)] })} />
							</div>
						</Panel>
					))}
				</div>
				<LadderSidebar
					cardIcon={<History className="size-4 text-cyan-500" />}
					cardTitle="Strike Accounting"
					cardText="Steps trigger the moment a player crosses the configured strike threshold."
					noteIcon={<Info className="size-3.5 text-primary-500" />}
					noteTitle="Decay Operations"
					noteText="Setting decay to 0 disables automated strike expiry."
				/>
			</div>
		</PageShell>
	);
}
