"use client";

import { Radio } from "lucide-react";
import { AddButton, DeleteButton, Field, InfoCard, InfoText, ListLayout, Panel, SectionBar, SelectInput, TextInput, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildResourceForm } from "@/hooks/use-guild-data";
import { patchById, removeById } from "@/lib/list";

interface LoggerRecord {
	id: string;
	category: string;
	channel: string;
	enabled: boolean;
}

const LOG_CATEGORIES = ["Queue Actions", "Match Outcomes", "Staff Commands", "Punishment Escalations", "New System Category"];

export default function Page() {
	const { value: loggers, setValue: setLoggers, isDirty, submit, saving, justSaved, error, isLoading } = useGuildResourceForm<LoggerRecord[]>("loggers", "loggers", []);
	const update = (id: string, patch: Partial<LoggerRecord>) => setLoggers((l) => patchById(l, id, patch));

	return (
		<PageShell eyebrow="Capabilities" title="Event Loggers" loading={isLoading} onSave={submit} saving={saving} dirty={isDirty} justSaved={justSaved} error={error}>
			<SectionBar
				title="Active Event log streams"
				description="Map internal bot event telemetry to specific Discord channels"
				action={<AddButton onClick={() => setLoggers((l) => [...l, { id: `log-${Date.now()}`, category: "New System Category", channel: "", enabled: true }])}>Append Log Stream</AddButton>}
			/>
			<ListLayout
				sidebar={
					<InfoCard icon={<Radio className="size-4 text-cyan-500 animate-pulse" />} title="Channel Streamer">
						<InfoText>Broadcasters output JSON formatted log streams. Debug levels can be restricted inside application configurations.</InfoText>
					</InfoCard>
				}
			>
				{loggers.map((l) => (
					<Panel key={l.id} className="space-y-3">
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
							<Field label="Log Category" className="sm:col-span-2">
								<SelectInput mini value={l.category} onValueChange={(category) => update(l.id, { category })} options={LOG_CATEGORIES} className="bg-bg-canvas/40 px-2" />
							</Field>
							<Field label="Destination Channel">
								<TextInput mini value={l.channel} onValueChange={(channel) => update(l.id, { channel })} className="bg-bg-canvas/40" />
							</Field>
							<div className="flex gap-2 justify-end sm:justify-start">
								<Toggle size="sm" checked={l.enabled} onChange={(enabled) => update(l.id, { enabled })} className="px-3" />
								<DeleteButton onClick={() => setLoggers((list) => removeById(list, l.id))} className="rounded-md" />
							</div>
						</div>
					</Panel>
				))}
			</ListLayout>
		</PageShell>
	);
}
