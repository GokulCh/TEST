"use client";

import { Info, Scale, ShieldAlert, SlidersHorizontal, Users } from "lucide-react";
import { useMemo } from "react";
import { Field, InfoCard, InfoText, ListLayout, NoteCard, NumberInput, Panel, Toggle, ToggleRow } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";
import type { FlowsConfig } from "@/lib/db-types";
import { withFlowDefaults } from "@/lib/flow-defaults";

/** The party limits as the page edits them (camelCase); `toFlow` maps them back to flows.party. */
interface PartyLimits {
	maxPartySize: number;
	maxEloDelta: number;
	inactivityDisbandTime: number;
	requireAllMembersInQueue: boolean;
	eloModifierIsEnabled: boolean;
	eloModifierMultiplier: number;
	eloModifierGamesThreshold: number;
	eloModifierFlatAdjustment: number;
	averagingMethod: string;
}

const DEFAULT_PARTY_LIMITS: PartyLimits = {
	maxPartySize: 4,
	maxEloDelta: 300,
	inactivityDisbandTime: 10,
	requireAllMembersInQueue: true,
	eloModifierIsEnabled: true,
	eloModifierMultiplier: 1.25,
	eloModifierGamesThreshold: 3,
	eloModifierFlatAdjustment: 0,
	averagingMethod: "average",
};

const AVERAGING_METHODS = [
	{ id: "average", label: "Average", desc: "Mean ELO across members." },
	{ id: "highest", label: "Highest", desc: "Uses peak ELO member." },
	{ id: "sum", label: "Sum", desc: "Totals party ELO pool." },
	{ id: "leader", label: "Leader", desc: "Party leader ELO only." },
];

const fromFlow = (p: Partial<FlowsConfig["party"]> | undefined): PartyLimits => ({
	maxPartySize: p?.max_size ?? DEFAULT_PARTY_LIMITS.maxPartySize,
	maxEloDelta: p?.max_elo_difference ?? DEFAULT_PARTY_LIMITS.maxEloDelta,
	inactivityDisbandTime: p?.inactivity_disband_time ?? DEFAULT_PARTY_LIMITS.inactivityDisbandTime,
	requireAllMembersInQueue: p?.require_all_members_in_queue ?? DEFAULT_PARTY_LIMITS.requireAllMembersInQueue,
	eloModifierIsEnabled: p?.elo_modifier_is_enabled ?? DEFAULT_PARTY_LIMITS.eloModifierIsEnabled,
	eloModifierMultiplier: p?.elo_modifier_multiplier ?? DEFAULT_PARTY_LIMITS.eloModifierMultiplier,
	eloModifierGamesThreshold: p?.elo_modifier_games_threshold ?? DEFAULT_PARTY_LIMITS.eloModifierGamesThreshold,
	eloModifierFlatAdjustment: p?.elo_modifier_flat_adjustment ?? DEFAULT_PARTY_LIMITS.eloModifierFlatAdjustment,
	averagingMethod: p?.elo_aggregation_method || DEFAULT_PARTY_LIMITS.averagingMethod,
});

const toFlow = (l: PartyLimits, previous: Partial<FlowsConfig["party"]> | undefined): FlowsConfig["party"] => ({
	...previous,
	max_size: l.maxPartySize,
	inactivity_disband_time: l.inactivityDisbandTime,
	elo_modifier_is_enabled: l.eloModifierIsEnabled,
	elo_modifier_multiplier: l.eloModifierMultiplier,
	elo_modifier_games_threshold: l.eloModifierGamesThreshold,
	elo_modifier_flat_adjustment: l.eloModifierFlatAdjustment,
	min_queue_size: previous?.min_queue_size ?? 0, // not editable here
	require_all_members_in_queue: l.requireAllMembersInQueue,
	max_elo_difference: l.maxEloDelta,
	elo_aggregation_method: l.averagingMethod,
});

export default function Page() {
	const { config, isLoading, isSaving, saveConfigSection } = useGuildConfig();

	const saved = useMemo(() => (config ? fromFlow(config.flows?.party) : null), [config]);
	const { value: limits, update, isDirty, submit, justSaved, error } = useSectionForm<PartyLimits>(saved, DEFAULT_PARTY_LIMITS, (l) =>
		saveConfigSection("flows", withFlowDefaults(config?.flows, { party: toFlow(l, config?.flows?.party) })),
	);

	const int = (field: keyof PartyLimits, fallback = 0) => (n: number) => update({ [field]: Math.trunc(n) || fallback });

	return (
		<PageShell eyebrow="Matchmaking" title="Party Limits" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} justSaved={justSaved} error={error}>
			<ListLayout
				sidebar={
					<>
						<InfoCard icon={<ShieldAlert className="size-4 text-rose-500" />} title="Exploitation Control">
							<InfoText>Restraints prevent high-ELO veterans from boosting low-ELO alternate accounts. Delta locks ensure matched queues remain competitive.</InfoText>
						</InfoCard>
						<NoteCard icon={<Info className="size-3.5 text-primary-500" />} title="Matching Info">
							If average party ELO is 1500 and aggregation is set to &quot;Highest&quot; (e.g. 1800), the matchmaking balancer treats the entire party as a single 1800-rated entry.
						</NoteCard>
					</>
				}
			>
				<InfoCard icon={<Users className="size-4 text-primary-500" />} title="Roster Scaling Rules">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Field label="Max Party Size">
							<NumberInput value={limits.maxPartySize} onValueChange={int("maxPartySize", 1)} />
						</Field>
						<Field label="Max Elo Difference">
							<NumberInput value={limits.maxEloDelta} onValueChange={int("maxEloDelta")} />
						</Field>
						<Field label="Inactivity Disband Time (Minutes)">
							<NumberInput value={limits.inactivityDisbandTime} onValueChange={int("inactivityDisbandTime")} />
						</Field>
						<ToggleRow title="Require All Members In Queue" description="Party only queues when every member is present." checked={limits.requireAllMembersInQueue} onChange={(requireAllMembersInQueue) => update({ requireAllMembersInQueue })} />
					</div>
				</InfoCard>

				<InfoCard icon={<Scale className="size-4 text-cyan-500" />} title="Party Rating Coefficient">
					<div className="space-y-3">
						<span className="block text-xs font-medium text-primary-500">// Party ELO Calculation Method</span>
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
							{AVERAGING_METHODS.map((opt) => (
								<div
									key={opt.id}
									onClick={() => update({ averagingMethod: opt.id })}
									className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
										limits.averagingMethod === opt.id ? "bg-primary-500/5 border-primary-500/20 text-primary-500" : "bg-bg-canvas/10 border-border-subtle/50 opacity-60 text-fg-muted"
									}`}
								>
									<span className="block text-xs font-medium">{opt.label}</span>
									<span className="text-xs mt-1">{opt.desc}</span>
								</div>
							))}
						</div>
					</div>
				</InfoCard>

				<Panel className="p-5 space-y-4">
					<div className="flex items-center justify-between gap-3 border-b border-border-subtle/50 pb-2.5">
						<div className="flex items-center gap-2">
							<SlidersHorizontal className="size-4 text-amber-500" />
							<h3 className="text-sm font-semibold text-fg-default">Elo Modifier</h3>
						</div>
						<Toggle size="sm" checked={limits.eloModifierIsEnabled} onChange={(eloModifierIsEnabled) => update({ eloModifierIsEnabled })} onLabel="ON" offLabel="OFF" className="h-7 px-3" />
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<Field label="Multiplier">
							<NumberInput step="0.05" value={limits.eloModifierMultiplier} onValueChange={(eloModifierMultiplier) => update({ eloModifierMultiplier })} />
						</Field>
						<Field label="Games Threshold">
							<NumberInput value={limits.eloModifierGamesThreshold} onValueChange={int("eloModifierGamesThreshold")} />
						</Field>
						<Field label="Flat Adjustment">
							<NumberInput value={limits.eloModifierFlatAdjustment} onValueChange={int("eloModifierFlatAdjustment")} />
						</Field>
					</div>
				</Panel>
			</ListLayout>
		</PageShell>
	);
}
