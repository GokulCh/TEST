"use client";

import { RefreshCw, Shuffle, SlidersHorizontal, UserCheck, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { ChoiceCard, Field, InfoCard, NumberInput, SelectInput, ToggleRow } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { useSectionForm } from "@/hooks/use-section-form";
import { withFlowDefaults } from "@/lib/flow-defaults";

type Algorithm = "elo" | "captains" | "random";

/** Stored as `flows.team_formation`. */
interface TeamFormation {
	algorithm: Algorithm;
	maxEloDelta: number;
	minQueueSize: number;
	requireAllMembersInQueue: boolean;
	eloAggregationMethod: string;
	captainsPickTimeout: number;
	autoPickFallback: boolean;
	preferPartiesTogether: boolean;
	dynamicRoleLocks: boolean;
}

const DEFAULT_CONFIG: TeamFormation = {
	algorithm: "elo",
	maxEloDelta: 150,
	minQueueSize: 2,
	requireAllMembersInQueue: true,
	eloAggregationMethod: "average",
	captainsPickTimeout: 30,
	autoPickFallback: true,
	preferPartiesTogether: true,
	dynamicRoleLocks: false,
};

const ALGORITHMS: { id: Algorithm; icon: React.ReactNode; title: string; description: string }[] = [
	{ id: "elo", icon: <SlidersHorizontal className="size-4" />, title: "Balanced ELO Matchmaker", description: "Groups players to balance ELO between teams. Best for competitive matches." },
	{ id: "captains", icon: <UserCheck className="size-4" />, title: "Captains Draft Sequence", description: "Highest ELO players pick teams in turns. Good for player-drafted matches." },
	{ id: "random", icon: <Shuffle className="size-4" />, title: "Randomized Scramble", description: "Completely random teams for casual/unranked games. Fastest queue times." },
];

const AGGREGATION_OPTIONS = [
	{ value: "average", label: "Average" },
	{ value: "highest", label: "Highest Member" },
	{ value: "sum", label: "Sum" },
	{ value: "leader", label: "Party Leader" },
];

export default function Page() {
	const { config: guildConfig, isLoading, isSaving, saveConfigSection } = useGuildConfig();

	const saved = useMemo<TeamFormation | null>(
		() => (guildConfig ? { ...DEFAULT_CONFIG, ...(guildConfig.flows as { team_formation?: Partial<TeamFormation> } | undefined)?.team_formation } : null),
		[guildConfig],
	);
	const { value: config, update, isDirty, submit, justSaved, error } = useSectionForm<TeamFormation>(saved, DEFAULT_CONFIG, (c) =>
		saveConfigSection("flows", withFlowDefaults(guildConfig?.flows, { team_formation: c })),
	);

	return (
		<PageShell eyebrow="Matchmaking" title="Team Balancing" loading={isLoading} onSave={submit} saving={isSaving} dirty={isDirty} justSaved={justSaved} error={error}>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{ALGORITHMS.map(({ id, ...card }) => (
					<ChoiceCard key={id} selected={config.algorithm === id} onSelect={() => update({ algorithm: id })} {...card} />
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<InfoCard icon={<UsersRound className="size-4 text-cyan-500" />} title="Algorithm Settings">
						{config.algorithm === "elo" && (
							<div className="space-y-4 motion-fade">
								<Field label="Max ELO Difference" hint="Teams are rejected if the ELO difference is too high.">
									<NumberInput value={config.maxEloDelta} onValueChange={(n) => update({ maxEloDelta: Math.trunc(n) })} />
								</Field>
								<Field label="Elo Aggregation Method">
									<SelectInput value={config.eloAggregationMethod} onValueChange={(eloAggregationMethod) => update({ eloAggregationMethod })} options={AGGREGATION_OPTIONS} />
								</Field>
								<Field label="Minimum Queue Size">
									<NumberInput value={config.minQueueSize} onValueChange={(n) => update({ minQueueSize: Math.trunc(n) })} />
								</Field>
								<ToggleRow title="Require All Members In Queue" description="A party only queues when every member has joined the channel." checked={config.requireAllMembersInQueue} onChange={(requireAllMembersInQueue) => update({ requireAllMembersInQueue })} />
								<ToggleRow title="Keep Parties Together" description="Prioritize keeping pre-formed parties on the same roster where feasible." checked={config.preferPartiesTogether} onChange={(preferPartiesTogether) => update({ preferPartiesTogether })} />
							</div>
						)}

						{config.algorithm === "captains" && (
							<div className="space-y-4 motion-fade">
								<Field label="Captain Turn Selection Timer (Seconds)">
									<NumberInput value={config.captainsPickTimeout} onValueChange={(n) => update({ captainsPickTimeout: Math.trunc(n) })} />
								</Field>
								<ToggleRow title="Auto-Pick Fallback" description="Automatically pick the highest remaining ELO player if draft timer expires." checked={config.autoPickFallback} onChange={(autoPickFallback) => update({ autoPickFallback })} />
							</div>
						)}

						{config.algorithm === "random" && (
							<div className="p-4 border border-dashed border-border-subtle/60 rounded-lg text-center text-xs text-fg-muted">
								No parameters needed. Scrambler mode operates on basic array shuffles.
							</div>
						)}
					</InfoCard>
				</div>

				<InfoCard icon={<RefreshCw className="size-4 text-amber-500" />} title="Algorithm Test Metrics">
					<div className="text-xs space-y-2 text-fg-muted">
						<div className="flex justify-between border-b border-border-subtle/20 pb-1"><span>Selected engine:</span><span className="text-primary-500 font-bold">{config.algorithm}</span></div>
						<div className="flex justify-between border-b border-border-subtle/20 pb-1"><span>Aggregation method:</span><span className="text-success">{config.eloAggregationMethod}</span></div>
						<div className="flex justify-between pb-1"><span>Max queue disparity:</span><span className="text-fg-default">{config.maxEloDelta} ELO</span></div>
					</div>
				</InfoCard>
			</div>
		</PageShell>
	);
}
