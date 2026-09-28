"use client";

import { AlertTriangle, Sliders } from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/panel/page-shell";
import { EmptyState, Field, InfoCard, InfoText, ListLayout, NumberInput, SelectInput } from "@/components/panel/form-parts";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import type { StrikeLadderStep } from "@/lib/db-types";

/** A step in the words the ladder page uses, with the amount that goes with it. */
function describe(step: StrikeLadderStep): string {
	const name = step.action.replace(/_/g, " ");
	const amount =
		step.action === "elo_removal" ? `${step.elo_removal ?? 0} ELO`
		: step.action === "server_ban" ? `${step.ban_days ?? 0} days`
		: step.action === "debuff" ? `${step.debuff_days ?? 0} days`
		: step.action === "disqualify" ? `${step.disqualify_days ?? 0} days`
		: step.duration ? `${step.duration} ${step.durationUnit ?? ""}`.trim()
		: "";
	return amount ? `${name} (${amount})` : name;
}

export default function Page() {
	const { config, isLoading } = useGuildConfig();
	const [strikes, setStrikes] = useState(0);
	const [levelKey, setLevelKey] = useState("");

	const levels = useMemo(() => Object.entries(config?.strike_ladder?.levels ?? {}), [config]);
	const [key, level] = levels.find(([k]) => k === levelKey) ?? levels[0] ?? [];
	const steps = useMemo(() => [...(level?.steps ?? [])].sort((a, b) => a.strikes_required - b.strikes_required), [level]);
	/** The highest step whose strike count the player has reached. */
	const reached = [...steps].reverse().find((s) => strikes >= s.strikes_required);
	const upcoming = steps.find((s) => s.strikes_required > strikes);
	const decay = config?.strike_ladder?.decay_interval_days;

	return (
		<PageShell eyebrow="Simulators" title="Strike Preview" loading={isLoading}>
			{levels.length === 0 ? (
				<EmptyState>No strike ladder is configured for this server yet. Set one up under Sanctions → Strike Ladder and preview it here.</EmptyState>
			) : (
				<ListLayout
					sidebar={
						<InfoCard icon={<AlertTriangle className="size-4 text-rose-500" />} title="About this preview">
							<InfoText>
								This shows what your saved strike ladder does at a given strike count.
								{decay ? ` Strikes decay every ${decay} days under the current settings.` : " Strike decay is off in the current settings."}
							</InfoText>
						</InfoCard>
					}
				>
					<InfoCard icon={<Sliders className="size-4 text-primary-500" />} title="Simulation Parameters">
						<Field label="Offence category">
							<SelectInput value={key ?? ""} onValueChange={setLevelKey} options={levels.map(([k, lv]) => ({ value: k, label: lv.name || k }))} />
						</Field>
						<Field label="Simulated player strikes">
							<NumberInput value={strikes} onValueChange={(n) => setStrikes(Math.max(0, n))} />
						</Field>
					</InfoCard>
					<InfoCard icon={<AlertTriangle className="size-4 text-amber-500" />} title="Expected automated action">
						<div className="space-y-3 text-sm">
							<div className="flex items-center justify-between gap-3">
								<span className="font-semibold text-fg-default">At {strikes} {strikes === 1 ? "strike" : "strikes"}</span>
								<span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium capitalize text-amber-500">{reached ? describe(reached) : "No action yet"}</span>
							</div>
							{upcoming && <InfoText>Next step at {upcoming.strikes_required} strikes: <span className="capitalize">{describe(upcoming)}</span>.</InfoText>}
							{steps.length === 0 && <InfoText>This category has no steps configured.</InfoText>}
						</div>
					</InfoCard>
				</ListLayout>
			)}
		</PageShell>
	);
}
