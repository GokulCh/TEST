"use client";

import { Radio } from "lucide-react";
import { AddButton, DeleteButton, Field, InfoCard, InfoText, ListLayout, Panel, SectionBar, SelectInput, TextInput, Toggle } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildResourceForm } from "@/hooks/use-guild-data";
import { patchById, removeById } from "@/lib/list";

interface WebhookRecord {
	id: string;
	event: string;
	url: string;
	enabled: boolean;
}

const WEBHOOK_EVENTS = ["Match Finalized", "Ban Logged", "Queue Threshold Reached", "Strike Issued"];

export default function Page() {
	const { value: hooks, setValue: setHooks, isDirty, submit, saving, justSaved, error, isLoading } = useGuildResourceForm<WebhookRecord[]>("webhooks", "webhooks", []);
	const update = (id: string, patch: Partial<WebhookRecord>) => setHooks((h) => patchById(h, id, patch));

	return (
		<PageShell eyebrow="Toolkits" title="Webhook Builder" loading={isLoading} onSave={submit} saving={saving} dirty={isDirty} justSaved={justSaved} error={error}>
			<SectionBar
				title="Active Event Webhooks"
				description="Transmit system events directly to target Discord channels"
				action={<AddButton onClick={() => setHooks((h) => [...h, { id: `hk-${Date.now()}`, event: WEBHOOK_EVENTS[0], url: "", enabled: true }])}>Append Webhook</AddButton>}
			/>
			<ListLayout
				sidebar={
					<InfoCard icon={<Radio className="size-4 text-cyan-500 animate-pulse" />} title="Event Broadcasters">
						<InfoText>When match outcomes are committed, payload details (ELO shift, scores, maps) are compiled into JSON and dispatched to target webhook endpoints.</InfoText>
					</InfoCard>
				}
			>
				{hooks.map((h) => (
					<Panel key={h.id} className="space-y-3">
						<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
							<Field label="System Event">
								<SelectInput mini value={h.event} onValueChange={(event) => update(h.id, { event })} options={WEBHOOK_EVENTS} className="bg-bg-canvas/40 px-2" />
							</Field>
							<Field label="Webhook Endpoint URL" className="sm:col-span-2">
								<TextInput mini value={h.url} onValueChange={(url) => update(h.id, { url })} className="bg-bg-canvas/40" />
							</Field>
							<div className="flex gap-2 justify-end sm:justify-start">
								<Toggle size="sm" checked={h.enabled} onChange={(enabled) => update(h.id, { enabled })} className="px-3" />
								<DeleteButton onClick={() => setHooks((list) => removeById(list, h.id))} className="rounded-md" />
							</div>
						</div>
					</Panel>
				))}
			</ListLayout>
		</PageShell>
	);
}
