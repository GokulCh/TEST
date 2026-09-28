"use client";

import { Crosshair, Info, Shield, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Field, InfoCard, NoteCard, NumberInput, Panel, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

const DEFAULT_WEIGHTS = {
	killMultiplier: 0,
	deathDeduction: 0,
	finalKillMultiplier: 0,
	bedBreakMultiplier: 0,
	mvpFlatBonus: 0,
	winStreakScale: 0,
	maxPerformanceCap: 0,
};
type Weights = typeof DEFAULT_WEIGHTS;

/**
 * NOTE: this page is not wired to the database. There is no stored field for
 * the performance toggle or the cap (EloEngineConfig only has a
 * `performance_weights` list), so "Commit" just resets the unsaved-changes flag.
 */
export default function Page() {
	const [enabled, setEnabled] = useState(false);
	const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS });
	const [saved, setSaved] = useState({ enabled: false, weights: { ...DEFAULT_WEIGHTS } });

	const { isDirty } = useUnsavedChanges({ enabled, weights }, saved);

	const set = (field: keyof Weights, step = 0.05) => ({
		step,
		value: weights[field],
		onValueChange: (n: number) => setWeights((prev) => ({ ...prev, [field]: n })),
	});

	// ponytail: local only, no backend section for this page yet; the shell labels it a preview.
	const commit = () => {
	setSaved({ enabled, weights: { ...weights } });
	};

	return (
		<PageShell preview eyebrow="Matchmaking" title="Stat Weights" onSave={commit} dirty={isDirty}>
			<Panel className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
				<div className="space-y-1 text-left">
					<h3 className="text-[13px] font-semibold text-fg-default">Performance-based rating</h3>
					<p className="text-xs text-fg-muted max-w-xl leading-relaxed">
						When activated, the matchmaking engine hooks into deep in-game telemetry metrics to dynamically scale rating shifts alongside base win/loss parameters.
					</p>
				</div>
				<Toggle checked={enabled} onChange={setEnabled} onLabel="Intercept Active" offLabel="Bypassed / Flat ELO" className="shrink-0" />
			</Panel>

			{enabled ? (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 motion-fade">
					<div className="lg:col-span-2 space-y-6">
						<InfoCard icon={<Crosshair className="size-4 text-primary-500" />} title="Gameplay adjustments">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Field label="Standard Kill Modifier"><NumberInput {...set("killMultiplier")} /></Field>
								<Field label="Standard Death Deduction"><NumberInput {...set("deathDeduction")} /></Field>
							</div>
						</InfoCard>
						<InfoCard icon={<Shield className="size-4 text-cyan-500" />} title="Objective Priority Modifiers">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Field label="Final Kill Weight Modifier"><NumberInput {...set("finalKillMultiplier", 0.1)} /></Field>
								<Field label="Bed Destruction Weight"><NumberInput {...set("bedBreakMultiplier", 0.1)} /></Field>
							</div>
						</InfoCard>
					</div>

					<div className="space-y-6">
						<InfoCard icon={<SlidersHorizontal className="size-4 text-amber-500" />} title="Engine Guardrails">
							<div className="space-y-4 text-left">
								<Field label="Absolute Performance Cap" hint="Maximum volatile bonus ELO capped per individual run">
									<NumberInput {...set("maxPerformanceCap", 1)} />
								</Field>
								<Field label="Win Streak Scaling Index"><NumberInput {...set("winStreakScale")} /></Field>
							</div>
						</InfoCard>

						<NoteCard icon={<Info className="size-3.5 text-primary-500" />} title="Formula Processing Note">
							<span className="block bg-bg-canvas/50 border border-border-subtle/60 p-2.5 rounded-lg text-xs text-fg-muted space-y-1">
								<span className="block text-fg-default font-bold">Delta Evaluation (player_stats)</span>
								<span className="block text-primary-400 text-xs leading-relaxed">Rank.k_factor_win / k_factor_loss + mvp_count * mvp_bonus</span>
								<span className="block text-[9px] text-fg-muted/60 mt-1">
									Momentum terms sample kills, final_kills, beds_destroyed and win_streak deltas; volatile bonus ELO stays bound within the guardrail cap above.
								</span>
							</span>
						</NoteCard>
					</div>
				</div>
			) : (
				<div className="p-12 border border-dashed border-border-subtle/50 rounded-2xl bg-panel-bg/5 text-center font-mono space-y-2 max-w-xl mx-auto">
					<h3 className="text-xs font-medium text-fg-muted">Performance Interceptors Halted</h3>
					<p className="text-xs text-fg-muted/60 leading-relaxed">
						The matchmaker configuration is currently locked to a flat evaluation setup. Win/Loss metrics are calculated strictly using target division presets defined on the rank parameters tabs.
					</p>
				</div>
			)}
		</PageShell>
	);
}
