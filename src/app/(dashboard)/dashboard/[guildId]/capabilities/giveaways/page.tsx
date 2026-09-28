"use client";

import { Sliders } from "lucide-react";
import { AddButton, DeleteButton, Field, InfoCard, InfoText, ListLayout, NumberInput, Panel, SectionBar, TextInput } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildResourceForm } from "@/hooks/use-guild-data";
import { patchById, removeById } from "@/lib/list";

interface GiveawayRecord {
	id: string;
	prize: string;
	winners: number;
	requiredElo: number;
	status: string;
	endsIn: string;
}

export default function Page() {
	const { value: giveaways, setValue: setGiveaways, isDirty, submit, saving, justSaved, error, isLoading } = useGuildResourceForm<GiveawayRecord[]>("giveaways", "giveaways", []);
	const update = (id: string, patch: Partial<GiveawayRecord>) => setGiveaways((g) => patchById(g, id, patch));

	return (
		<PageShell eyebrow="Capabilities" title="Giveaways" loading={isLoading} onSave={submit} saving={saving} dirty={isDirty} justSaved={justSaved} error={error}>
			<SectionBar
				title="Active Raffles"
				description="Create ELO-restricted giveaways to incentivize queue activity"
				action={<AddButton onClick={() => setGiveaways((g) => [...g, { id: `gv-${Date.now()}`, prize: "", winners: 1, requiredElo: 0, status: "Active", endsIn: "" }])}>Dispatch Giveaway</AddButton>}
			/>
			<ListLayout
				sidebar={
					<InfoCard icon={<Sliders className="size-4 text-cyan-500" />} title="Entry Gates">
						<InfoText>Setting ELO requirements bars players below rating limits. Entry commands are processed instantly upon ticket buttons interaction.</InfoText>
					</InfoCard>
				}
			>
				{giveaways.map((g) => (
					<Panel key={g.id} className="space-y-3">
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
							<Field label="Prize Description">
								<TextInput mini value={g.prize} onValueChange={(prize) => update(g.id, { prize })} className="bg-bg-canvas/40" />
							</Field>
							<Field label="Winners Count">
								<NumberInput mini value={g.winners} fallback={1} onValueChange={(winners) => update(g.id, { winners })} className="bg-bg-canvas/40" />
							</Field>
							<Field label="Required ELO Gate">
								<NumberInput mini value={g.requiredElo} onValueChange={(requiredElo) => update(g.id, { requiredElo })} className="bg-bg-canvas/40" />
							</Field>
							<div className="flex gap-2 justify-end sm:justify-start">
								<span className="h-8 px-3 flex items-center border border-success/20 bg-success/10 text-success text-xs font-medium rounded-md">{g.status}</span>
								<DeleteButton onClick={() => setGiveaways((list) => removeById(list, g.id))} className="rounded-md" />
							</div>
						</div>
					</Panel>
				))}
			</ListLayout>
		</PageShell>
	);
}
