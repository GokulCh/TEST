"use client";

import { Gavel, Scale, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { AddButton, DeleteButton, EmptyState, Field, Panel, SectionBar, SelectInput } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { AddStepButton, DurationFields, LadderSidebar, LevelHeader, OffenceModeField, patchByKey, type DurationUnit, type Keyed, type OffenceMode } from "@/features/sanctions/ladder-parts";
import { useSectionForm } from "@/hooks/use-section-form";
import type { PunishmentLadderConfig, PunishmentLadderLevel } from "@/lib/db-types";

const PUNISHMENT_TYPES = ["warning", "chat_mute", "vc_mute", "queue_ban", "server_ban", "strike_tag"];

interface UIStep extends Keyed { type: string; duration: number; durationUnit: DurationUnit }
interface UILevel extends Omit<PunishmentLadderLevel, "steps">, Keyed { steps: UIStep[] }
interface FormValue { offenceMode: OffenceMode; levels: UILevel[] }

function toUI(cfg: PunishmentLadderConfig): UILevel[] {
	return Object.entries(cfg.levels ?? {}).map(([k, lv]) => ({
		...lv,
		_key: k,
		steps: (lv.steps ?? []).map((s: Record<string, unknown>, i: number) => ({
			_key: `${k}-${i}`,
			type: (s.type as string) ?? "warning",
			duration: (s.duration as number) ?? 0,
			durationUnit: (s.durationUnit as DurationUnit) ?? "days",
		})),
	}));
}

function fromUI(levels: UILevel[]): Record<string, PunishmentLadderLevel> {
	return Object.fromEntries(
		levels.map(({ _key, steps, ...rest }) => [_key, { ...rest, steps: steps.map(({ _key: _, ...s }) => s) as PunishmentLadderLevel["steps"] }]),
	);
}

export default function Page() {
	const { config, isLoading, isSaving, saveConfigSection } = useGuildConfig();

	const saved = useMemo<FormValue | null>(() => {
		const cfg = config?.punishment_ladder;
		return cfg ? { offenceMode: cfg.offence_mode ?? "persistent", levels: toUI(cfg) } : null;
	}, [config]);
	const { value, update, isDirty, submit, justSaved, error } = useSectionForm<FormValue>(saved, { offenceMode: "persistent", levels: [] }, (v) =>
		saveConfigSection("punishment-ladder", { offence_mode: v.offenceMode, levels: fromUI(v.levels) }),
	);
	const { levels } = value;

	const setLevels = (fn: (l: UILevel[]) => UILevel[]) => update({ levels: fn(levels) });
	const updateLevel = (key: string, patch: Partial<UILevel>) => setLevels((l) => patchByKey(l, key, patch));
	const updateStep = (levelKey: string, stepKey: string, patch: Partial<UIStep>) =>
		setLevels((l) => l.map((lv) => (lv._key === levelKey ? { ...lv, steps: patchByKey(lv.steps, stepKey, patch) } : lv)));
	const addLevel = () => {
		const k = `level-${Date.now()}`;
		setLevels((l) => [...l, { _key: k, id: k, punishmentType: "warning", name: "New Category", description: null, enabled: true, steps: [] }]);
	};

	return (
		<PageShell eyebrow="Sanctions" title="Punishment Ladder" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} error={error}>
			<OffenceModeField value={value.offenceMode} onChange={(offenceMode) => update({ offenceMode })} />

			<SectionBar title="Punishment levels" description="Each offence category escalates through ordered enforcement steps" action={<AddButton onClick={addLevel}>Append Ladder Level</AddButton>} />

			{levels.length === 0 && <EmptyState>No levels — click &ldquo;Append Ladder Level&rdquo; to add one.</EmptyState>}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-4">
					{levels.map((level) => (
						<Panel key={level._key} className="space-y-3">
							<LevelHeader
								icon={<Gavel className="size-3.5 text-cyan-500" />}
								name={level.name}
								onName={(name) => updateLevel(level._key, { name })}
								enabled={level.enabled}
								onEnabled={(enabled) => updateLevel(level._key, { enabled })}
								onDelete={() => setLevels((l) => l.filter((x) => x._key !== level._key))}
							/>

							<div className="grid grid-cols-2 gap-3">
								<Field label="Offence Type" mini>
									<SelectInput mini value={level.punishmentType || "warning"} onValueChange={(punishmentType) => updateLevel(level._key, { punishmentType })} options={PUNISHMENT_TYPES} />
								</Field>
								<Field label="Description" mini>
									<input type="text" value={level.description ?? ""} onChange={(e) => updateLevel(level._key, { description: e.target.value })} className="w-full h-8 px-2.5 bg-panel-bg/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none" />
								</Field>
							</div>

							<div className="space-y-2">
								{level.steps.map((step) => (
									<div key={step._key} className="p-3 rounded-lg border border-border-subtle/50 bg-bg-canvas/20 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
										<Field label="Action Type" mini>
											<SelectInput mini value={step.type} onValueChange={(type) => updateStep(level._key, step._key, { type })} options={PUNISHMENT_TYPES} />
										</Field>
										<DurationFields
											duration={step.duration}
											unit={step.durationUnit}
											onDuration={(duration) => updateStep(level._key, step._key, { duration })}
											onUnit={(durationUnit) => updateStep(level._key, step._key, { durationUnit })}
										/>
										<DeleteButton onClick={() => updateLevel(level._key, { steps: level.steps.filter((s) => s._key !== step._key) })} className="rounded-md" />
									</div>
								))}
								<AddStepButton onClick={() => updateLevel(level._key, { steps: [...level.steps, { _key: `${level._key}-${Date.now()}`, type: "warning", duration: 0, durationUnit: "days" }] })} />
							</div>
						</Panel>
					))}
				</div>
				<LadderSidebar
					cardIcon={<ShieldAlert className="size-4 text-rose-500" />}
					cardTitle="Enforcement Pipeline"
					cardText="Steps apply in ascending order. A zero duration produces an immediate, unbounded enforcement."
					noteIcon={<Scale className="size-3.5 text-primary-500" />}
					noteTitle="Offence Modes"
					noteText="Persistent tracks lifetime offence history. Active only requires concurrent active strikes before escalation."
				/>
			</div>
		</PageShell>
	);
}
