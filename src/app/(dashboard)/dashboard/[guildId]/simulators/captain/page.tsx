"use client";

import { Users } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/panel/page-shell";
import { RefreshButton } from "@/components/panel/data-table";
import { Button, AddButton, DeleteButton, InfoCard, ListLayout, MiniCard, TextInput } from "@/components/panel/form-parts";

export default function Page() {
	const [turn, setTurn] = useState<0 | 1>(0);
	const [teams, setTeams] = useState<[string[], string[]]>([[], []]);
	const [pool, setPool] = useState<string[]>([]);

	const pick = (index: number) => {
		const player = pool[index];
		setPool((p) => p.filter((_, i) => i !== index));
		setTeams((t) => (turn === 0 ? [[...t[0], player], t[1]] : [t[0], [...t[1], player]]));
		setTurn(turn === 0 ? 1 : 0);
	};

	const reset = () => {
		setTeams([[], []]);
		setPool([]);
		setTurn(0);
	};

	const roster = (title: string, tone: string, players: string[]) => (
		<MiniCard title={title} tone={tone}>
			{players.map((p, i) => <div key={i} className="border-b border-border-subtle/10 pb-0.5">{p}</div>)}
			{players.length === 0 && <div className="text-xs text-fg-muted/40">Roster Empty</div>}
		</MiniCard>
	);

	return (
		<PageShell eyebrow="Simulators" title="Captain Pick Sequence" actions={<RefreshButton onClick={reset} refreshing={false} label="Reset Draft" />}>
			<ListLayout
				sidebar={
					<>
						{roster("Team Alpha (Captain A)", "text-cyan-400", teams[0])}
						{roster("Team Beta (Captain B)", "text-violet-400", teams[1])}
					</>
				}
			>
				<InfoCard
					icon={<Users className="size-4 text-cyan-500" />}
					title="Available Player Pool"
					action={
						<div className="flex items-center gap-2">
							<AddButton onClick={() => setPool((p) => [...p, ""])} className="h-7 px-2 text-[9px]">Add Player</AddButton>
							<span className="text-xs text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded font-medium capitalize">
								{turn === 0 ? "Captain Alpha Turn" : "Captain Beta Turn"}
							</span>
						</div>
					}
				>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{pool.map((name, i) => (
							<div key={i} className="flex gap-2">
								<TextInput value={name} onValueChange={(v) => setPool((p) => p.map((n, j) => (j === i ? v : n)))} placeholder="Player Name (ELO)" className="flex-1" />
								<Button variant="primary"
									onClick={() => pick(i)}
									disabled={!name}>
									Pick
								</Button>
								<DeleteButton onClick={() => setPool((p) => p.filter((_, j) => j !== i))} label={`Remove ${name || "player"}`} className="h-9" />
							</div>
						))}
						{pool.length === 0 && <div className="sm:col-span-2 text-center py-4 text-xs text-fg-muted">All players drafted</div>}
					</div>
				</InfoCard>
			</ListLayout>
		</PageShell>
	);
}
