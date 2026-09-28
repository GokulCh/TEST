"use client";

import { SlidersHorizontal, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/panel/page-shell";
import { AddButton, DeleteButton, EmptyState, Field, InfoCard, ListLayout, MiniCard, NumberInput, SelectInput, StatRow } from "@/components/panel/form-parts";
import { useGuildConfig } from "@/features/dashboard/config-provider";

const TONES = ["text-cyan-400", "text-violet-400", "text-emerald-400", "text-amber-400", "text-rose-400"];

/** Greedy partition: highest ELO first onto the team with the lowest total that still has room. */
function balance(elos: number[], teamCount: number, teamSize: number) {
	const teams: number[][] = Array.from({ length: teamCount }, () => []);
	const sums = Array(teamCount).fill(0) as number[];
	for (const elo of [...elos].sort((a, b) => b - a)) {
		const open = teams.map((t, i) => i).filter((i) => teams[i].length < teamSize);
		const pool = open.length ? open : teams.map((_, i) => i);
		const t = pool.reduce((best, i) => (sums[i] < sums[best] ? i : best), pool[0]);
		teams[t].push(elo);
		sums[t] += elo;
	}
	return teams.map((team, t) => ({ team, avg: team.length ? Math.round(sums[t] / team.length) : 0 }));
}

export default function Page() {
	const { meta, isLoading } = useGuildConfig();
	const [elos, setElos] = useState<number[]>([]);
	const [modeId, setModeId] = useState("");

	// Team layout comes from the guild's own modes.
	const modes = useMemo(() => (meta?.modes ?? []).filter((m) => m.is_enabled && m.team_count > 0 && m.players_per_team > 0), [meta]);
	const modeKey = (m: (typeof modes)[number]) => m.stable_id ?? m.name;
	const mode = modes.find((m) => modeKey(m) === modeId) ?? modes[0];

	const teams = mode ? balance(elos, mode.team_count, mode.players_per_team) : [];
	const avgs = teams.filter((t) => t.team.length).map((t) => t.avg);
	const delta = avgs.length > 1 ? Math.max(...avgs) - Math.min(...avgs) : 0;

	return (
		<PageShell eyebrow="Simulators" title="Party Balancing Simulator" loading={isLoading}>
			{!mode ? (
				<EmptyState>No enabled game modes are configured for this server yet. Add one under Matchmaking → Queues and its team layout will be used here.</EmptyState>
			) : (
				<ListLayout
					sidebar={
						<InfoCard icon={<SlidersHorizontal className="size-4 text-cyan-500" />} title="Simulated Delta Variance">
							<div className="text-xs text-fg-muted">
								<StatRow label="Rating delta" className={`text-sm font-semibold ${delta < 100 ? "text-success" : "text-amber-500"}`}>{delta} ELO gap</StatRow>
							</div>
						</InfoCard>
					}
				>
					<InfoCard
						icon={<Users className="size-4 text-primary-500" />}
						title="Pool Player ELOs"
						action={<AddButton onClick={() => setElos((e) => [...e, 0])}>Add Player</AddButton>}
					>
						<Field label="Game mode" hint={`${mode.team_count} teams of ${mode.players_per_team}`}>
							<SelectInput value={modeKey(mode)} onValueChange={setModeId} options={modes.map((m) => ({ value: modeKey(m), label: m.name }))} />
						</Field>
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
							{elos.map((elo, i) => (
								<Field key={i} label={`Player ${i + 1}`}>
									<div className="flex gap-1">
										<NumberInput mini value={elo} onValueChange={(n) => setElos((e) => e.map((v, j) => (j === i ? n : v)))} />
										<DeleteButton onClick={() => setElos((e) => e.filter((_, j) => j !== i))} label={`Remove player ${i + 1}`} className="h-8" />
									</div>
								</Field>
							))}
						</div>
						{elos.length > mode.team_count * mode.players_per_team && (
							<p className="text-xs text-amber-500">This mode fits {mode.team_count * mode.players_per_team} players; extras are spread over the teams anyway.</p>
						)}
					</InfoCard>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{teams.map((t, i) => (
							<MiniCard key={i} title={`Team ${i + 1}`} tone={TONES[i % TONES.length]}>
								{t.team.map((elo, j) => (
									<StatRow key={j} label="Member ELO" className="font-medium">{elo}</StatRow>
								))}
								<StatRow label="Avg Rating" className="font-semibold">{t.avg}</StatRow>
							</MiniCard>
						))}
					</div>
				</ListLayout>
			)}
		</PageShell>
	);
}
