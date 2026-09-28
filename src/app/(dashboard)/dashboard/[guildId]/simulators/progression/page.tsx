"use client";

import { SlidersHorizontal, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/panel/page-shell";
import { EmptyState, Field, InfoCard, ListLayout, NumberInput, StatRow } from "@/components/panel/form-parts";
import { useGuildConfig } from "@/features/dashboard/config-provider";

export default function Page() {
	const { meta, isLoading } = useGuildConfig();
	const [elo, setElo] = useState(0);

	// The guild's own ladder, lowest rank first.
	const ranks = useMemo(() => [...(meta?.ranks ?? [])].sort((a, b) => a.min_elo - b.min_elo), [meta]);

	const current = [...ranks].reverse().find((r) => elo >= r.min_elo) ?? ranks[0];
	const next = current ? ranks[ranks.indexOf(current) + 1] : undefined;
	const span = current && next ? next.min_elo - current.min_elo : 0;
	const percent = !next ? 100 : span > 0 ? Math.min(100, Math.max(0, Math.round(((elo - current.min_elo) / span) * 100))) : 0;

	return (
		<PageShell eyebrow="Simulators" title="Rank Progression Visualizer" loading={isLoading}>
			{ranks.length === 0 ? (
				<EmptyState>No ranks are configured for this server yet. Add them under Matchmaking → Ranks and they will show up here.</EmptyState>
			) : (
				<ListLayout
					sidebar={
						<InfoCard icon={<Trophy className="size-4 text-amber-500" />} title="Rank Boundaries">
							<div className="space-y-2 text-xs text-fg-muted">
								{ranks.map((r) => (
									<StatRow key={r.rank_name} label={r.rank_name} className="font-medium">{r.min_elo}+ ELO</StatRow>
								))}
							</div>
						</InfoCard>
					}
				>
					<InfoCard icon={<SlidersHorizontal className="size-4 text-primary-500" />} title="Simulation Parameters">
						<Field label="Simulate Player ELO Rating"><NumberInput value={elo} onValueChange={setElo} /></Field>
					</InfoCard>
					<InfoCard icon={<Trophy className="size-4 text-cyan-500" />} title="Progress to Next Rank">
						<div className="space-y-4 text-xs">
							<div className="flex items-center justify-between font-medium">
								<span className="text-primary-500" style={current?.color ? { color: current.color } : undefined}>{current?.rank_name}</span>
								{next ? <span className="text-fg-muted">Next: {next.rank_name}</span> : <span className="font-semibold text-success">Top rank reached</span>}
							</div>
							<div className="h-4 w-full overflow-hidden rounded-full border border-border-subtle bg-bg-canvas/40">
								<div className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-300" style={{ width: `${percent}%` }} />
							</div>
							<div className="flex justify-between text-xs text-fg-muted">
								<span>Current ELO: {elo}</span>
								{next && <span>Required ELO: {next.min_elo} ({Math.max(0, next.min_elo - elo)} more)</span>}
							</div>
						</div>
					</InfoCard>
				</ListLayout>
			)}
		</PageShell>
	);
}
