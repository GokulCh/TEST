"use client";

import { Network, Trophy } from "lucide-react";
import { useState } from "react";
import { AddButton, EmptyState, SectionBar } from "@/components/panel/form-parts";
import { GuardedTabs } from "@/components/panel/guarded-tabs";
import { PageShell } from "@/components/panel/page-shell";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import { ModeCard, newGroup, newMode, QueueGroupCard } from "@/features/matchmaking/queue-parts";
import { useSectionForm } from "@/hooks/use-section-form";
import { useTabGuard } from "@/hooks/use-tab-guard";
import type { ModeConfig, QueueConfig } from "@/lib/db-types";
import { Panel } from "@/components/panel/form-parts";

type Tab = "modes" | "architecture";

const TABS = [
	{ key: "modes" as const, title: "Match Modes & Rulesets", label: <><Trophy className="size-3.5" /> 1. Match Modes &amp; Rulesets</> },
	{ key: "architecture" as const, title: "Queue Architecture", label: <><Network className="size-3.5" /> 2. Queue Architecture</> },
];

export default function Page() {
	const { meta, queues: dbQueues, isLoading, isSaving, saveMetaSection, saveQueues } = useGuildConfig();
	const [activeTab, setActiveTab] = useState<Tab>("modes");

	// Each tab is its own form: it saves separately and is guarded separately.
	const modesForm = useSectionForm<ModeConfig[]>(meta?.modes ?? null, [], (m) => saveMetaSection("modes", m));
	const queuesForm = useSectionForm<QueueConfig[]>(dbQueues, [], (q) => saveQueues(q));
	const forms = { modes: modesForm, architecture: queuesForm };
	const active = forms[activeTab];

	const tabGuard = useTabGuard<Tab>({
		activeTab,
		setActiveTab,
		tabSnapshots: {
			modes: { local: modesForm.value, saved: meta?.modes ?? null },
			architecture: { local: queuesForm.value, saved: dbQueues },
		},
		onDiscard: (tab) => {
			if (tab === "modes" && meta?.modes) modesForm.setValue(meta.modes);
			else if (tab === "architecture") queuesForm.setValue(dbQueues);
		},
	});

	const modes = modesForm.value;
	const groups = queuesForm.value;
	const updateMode = (idx: number, patch: Partial<ModeConfig>) => modesForm.setValue((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
	const updateGroup = (idx: number, patch: Partial<QueueConfig>) => queuesForm.setValue((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));

	return (
		<PageShell eyebrow="Matchmaking" title="Queue Configuration" loading={isLoading} onSave={active.submit} saving={isSaving} dirty={modesForm.isDirty || queuesForm.isDirty} justSaved={active.justSaved} error={active.error}>
			<GuardedTabs tabs={TABS} active={activeTab} guard={tabGuard} />

			{activeTab === "modes" && (
				<Panel className="p-5 space-y-6 motion-fade">
					<SectionBar
						title="Game Modes & Rules"
						icon={<Trophy className="size-4 text-primary-500" />}
						action={<AddButton onClick={() => modesForm.setValue((prev) => [...prev, newMode(prev.length + 1)])}>Add Game Mode</AddButton>}
					/>
					{modes.length === 0 && <EmptyState>No modes configured — click &ldquo;Add Game Mode&rdquo; to add one.</EmptyState>}
					<div className="space-y-6">
						{modes.map((mode, idx) => (
							<ModeCard key={idx} mode={mode} onChange={(patch) => updateMode(idx, patch)} onRemove={() => modesForm.setValue((prev) => prev.filter((_, i) => i !== idx))} />
						))}
					</div>
				</Panel>
			)}

			{activeTab === "architecture" && (
				<div className="space-y-6 motion-fade">
					<SectionBar
						title="Queue Group Bindings"
						description="Bind Discord categories and voice channels to matchmaking queue listeners"
						action={<AddButton onClick={() => queuesForm.setValue((prev) => [...prev, newGroup()])}>Add Queue Group</AddButton>}
					/>
					{groups.length === 0 && <EmptyState>No queue groups — click &ldquo;Add Queue Group&rdquo; to create one.</EmptyState>}
					{groups.map((group, gi) => (
						<QueueGroupCard key={gi} group={group} modes={modes} onChange={(patch) => updateGroup(gi, patch)} onRemove={() => queuesForm.setValue((prev) => prev.filter((_, i) => i !== gi))} />
					))}
				</div>
			)}
		</PageShell>
	);
}
