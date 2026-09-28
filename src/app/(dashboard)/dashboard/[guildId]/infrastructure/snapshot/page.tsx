"use client";

import { Database, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useGuildData, useGuildWrite } from "@/hooks/use-guild-data";
import type { GuildSnapshotBundle } from "@/lib/db-types";

import { RefreshButton } from "@/components/panel/data-table";
import { EmptyState, InfoCard, NoteCard } from "@/components/panel/form-parts";
import { PageShell } from "@/components/panel/page-shell";

interface SnapshotEntry {
	id: string;
	name: string;
	type?: string;
	color?: string;
}
type SnapshotData = Record<"channels" | "categories" | "roles" | "threads", Record<string, SnapshotEntry>>;

const GROUPS = [
	{ key: "channels", label: "Channels", tone: "text-cyan-500" },
	{ key: "categories", label: "Categories", tone: "text-violet-500" },
	{ key: "roles", label: "Roles", tone: "text-amber-500" },
	{ key: "threads", label: "Threads", tone: "text-rose-500" },
] as const;

export default function Page() {
	const write = useGuildWrite();
	// The snapshot is whatever the bot last reported; "Sync from Discord" re-reads it (the bot does the syncing).
	const { data, error: loadError, isLoading, isValidating, mutate } = useGuildData<GuildSnapshotBundle>("snapshot");
	const snapshot = (data?.state as SnapshotData | undefined) ?? null;
	const [saving, setSaving] = useState(false);
	const [justSaved, setJustSaved] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const save = async () => {
		if (!snapshot) return;
		setSaving(true);
		setSaveError(null);
		try {
			await write("PUT", "snapshot", snapshot);
			setJustSaved(true);
			setTimeout(() => setJustSaved(false), 2500);
		} catch (error) {
			setSaveError(error instanceof Error ? error.message : "Save failed");
		} finally {
			setSaving(false);
		}
	};

	return (
		<PageShell
			eyebrow="Infrastructure"
			title="Guild Snapshot Manager"
			loading={isLoading}
			actions={<RefreshButton onClick={() => mutate()} refreshing={isValidating && !isLoading} label="Sync from Discord" />}
			onSave={save}
			saving={saving}
			justSaved={justSaved}
			error={saveError ?? loadError?.message}
		>
			<NoteCard icon={<Database className="size-4 text-primary-500" />} title="Guild Snapshot Data">
				This page displays the guild's channels, categories, roles, and threads as stored in the database. Changes here affect how the bot references Discord entities.
			</NoteCard>

			{!snapshot ? (
				<EmptyState>
					<ShieldAlert className="size-8 mx-auto mb-3" />
					No snapshot data available. Click &quot;Sync from Discord&quot; to fetch the current guild state.
				</EmptyState>
			) : (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{GROUPS.map(({ key, label, tone }) => {
						const entries = Object.entries(snapshot[key] ?? {});
						return (
							<InfoCard key={key} icon={<Database className={`size-4 ${tone}`} />} title={`${label} (${entries.length})`}>
								<div className="space-y-2 max-h-96 overflow-y-auto">
									{entries.map(([entryKey, entry]) => (
										<div key={entryKey} className="p-3 bg-bg-canvas/30 border border-border-subtle/40 rounded-lg flex justify-between items-start gap-2">
											<div className="min-w-0">
												<p className="text-xs font-semibold text-fg-default truncate">{entry.name}</p>
												<p className="text-xs text-fg-muted mt-0.5">{entry.id}</p>
											</div>
											{entry.color ? (
												<span className="text-xs text-fg-default px-1.5 py-0.5 rounded capitalize" style={{ backgroundColor: `#${entry.color}20`, border: `1px solid #${entry.color}40` }}>
													#{entry.color}
												</span>
											) : (
												<span className="text-xs text-fg-muted bg-panel-bg px-1.5 py-0.5 rounded capitalize">{entry.type}</span>
											)}
										</div>
									))}
								</div>
							</InfoCard>
						);
					})}
				</div>
			)}
		</PageShell>
	);
}
