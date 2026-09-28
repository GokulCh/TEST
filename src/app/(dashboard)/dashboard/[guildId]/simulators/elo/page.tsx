"use client";

import { Calculator, Info, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { PageShell } from "@/components/panel/page-shell";
import { Field, InfoCard, ListLayout, NoteCard, NumberInput, SelectInput, StatRow } from "@/components/panel/form-parts";
import { useGuildConfig } from "@/features/dashboard/config-provider";

/** Used only when the guild has no ranks configured yet. */
const FALLBACK_K = 32;
const shiftLabel = (n: number) => (n >= 0 ? `+${n}` : String(n));
const shiftTone = (n: number) => (n >= 0 ? "font-semibold text-sm text-success" : "font-semibold text-sm text-rose-500");

export default function Page() {
	const { meta, isLoading } = useGuildConfig();
	const [teamAElo, setTeamAElo] = useState(1000);
	const [teamBElo, setTeamBElo] = useState(1000);
	const [winner, setWinner] = useState<"A" | "B">("A");

	const ranks = useMemo(() => [...(meta?.ranks ?? [])].sort((a, b) => a.min_elo - b.min_elo), [meta]);
	/** The rank an ELO falls in decides its K-factors, exactly as the guild configured them. */
	const rankOf = (elo: number) => [...ranks].reverse().find((r) => elo >= r.min_elo) ?? ranks[0];
	const kWin = (elo: number) => rankOf(elo)?.k_factor_win ?? FALLBACK_K;
	const kLoss = (elo: number) => rankOf(elo)?.k_factor_loss ?? FALLBACK_K;

	const expectedA = 1 / (1 + Math.pow(10, (teamBElo - teamAElo) / 400));
	const shiftA = winner === "A" ? Math.round(kWin(teamAElo) * (1 - expectedA)) : -Math.round(kLoss(teamAElo) * expectedA);
	const shiftB = winner === "B" ? Math.round(kWin(teamBElo) * expectedA) : -Math.round(kLoss(teamBElo) * (1 - expectedA));
	const rankLabel = (elo: number) => (rankOf(elo) ? ` (${rankOf(elo).rank_name})` : "");

	return (
		<PageShell eyebrow="Simulators" title="ELO Projection Simulator" loading={isLoading}>
			<ListLayout
				sidebar={
					<>
						<InfoCard icon={<TrendingUp className="size-4 text-cyan-500" />} title="Simulated Rating Shift">
							<div className="space-y-3 text-xs text-fg-muted">
								<StatRow label={`Team A Shift${rankLabel(teamAElo)}`} className={shiftTone(shiftA)}>{shiftLabel(shiftA)} ELO</StatRow>
								<StatRow label={`Team B Shift${rankLabel(teamBElo)}`} className={shiftTone(shiftB)}>{shiftLabel(shiftB)} ELO</StatRow>
							</div>
						</InfoCard>
						<NoteCard icon={<Info className="size-3.5 text-primary-500" />} title="Formula note">
							{ranks.length > 0
								? "K-factors come from each team's rank in this server's rank configuration: the win K for the winner, the loss K for the loser. Performance and MVP bonuses are not included."
								: `No ranks are configured yet, so a default K-factor of ${FALLBACK_K} is used. Add ranks under Matchmaking → Ranks for projections that match your server.`}
						</NoteCard>
					</>
				}
			>
				<InfoCard icon={<Calculator className="size-4 text-primary-500" />} title="Projection Variables">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="Team A Avg ELO"><NumberInput value={teamAElo} onValueChange={setTeamAElo} fallback={1000} /></Field>
						<Field label="Team B Avg ELO"><NumberInput value={teamBElo} onValueChange={setTeamBElo} fallback={1000} /></Field>
					</div>
					<Field label="Simulated Match Winner">
						<SelectInput value={winner} onValueChange={(v) => setWinner(v as "A" | "B")} options={[{ value: "A", label: "Team A wins" }, { value: "B", label: "Team B wins" }]} />
					</Field>
				</InfoCard>
			</ListLayout>
		</PageShell>
	);
}
