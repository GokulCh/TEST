"use client";

import { Activity, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/panel/page-shell";
import { Field, InfoCard, ListLayout, NumberInput, StatRow } from "@/components/panel/form-parts";

export default function Page() {
	const [activePlayers, setActivePlayers] = useState(0);
	const [searchExpansion, setSearchExpansion] = useState(0); // ELO per tick

	const waitSeconds =
		activePlayers > 0 && searchExpansion > 0 ? Math.max(10, Math.round(600 / (activePlayers * (searchExpansion / 50)))) : 0;

	return (
		<PageShell eyebrow="Simulators" title="Queue Math Simulator">
			<ListLayout
				sidebar={
					<InfoCard icon={<Activity className="size-4 text-cyan-500" />} title="Simulated Wait Times">
						<div className="text-xs text-fg-muted">
							<StatRow label="Est. Avg Wait Time" className="font-semibold text-sm text-success">{waitSeconds} Seconds</StatRow>
						</div>
					</InfoCard>
				}
			>
				<InfoCard icon={<SlidersHorizontal className="size-4 text-primary-500" />} title="Simulate Queue Bounds">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Field label="Active Queue Pool Players"><NumberInput value={activePlayers} onValueChange={setActivePlayers} /></Field>
						<Field label="ELO Range Expansion Rate ( / Sec)"><NumberInput value={searchExpansion} onValueChange={setSearchExpansion} /></Field>
					</div>
				</InfoCard>
			</ListLayout>
		</PageShell>
	);
}
