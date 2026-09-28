"use client";

import { useState } from "react";
import { useGuildData } from "@/hooks/use-guild-data";
import { relativeTime } from "@/lib/format";
import type { GuildEventModel } from "@/lib/db-types";

import { DataTable, RefreshButton, SearchInput, TableState } from "@/components/panel/data-table";
import { PageShell } from "@/components/panel/page-shell";
// Format the event type into a human-readable action label
function formatEventType(type: string): string {
	return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The DB stores event context in a free-form JSON blob, so probe the usual keys. */
function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

/**
 * `guild_events` has no dedicated initiator column, so the acting user is read
 * out of the event payload when the writer included one.
 */
function formatInitiator(event: GuildEventModel): string {
	const payload = { ...asRecord(event.data), ...asRecord(event.metadata) };
	return (
		(payload.initiator_id as string) ??
		(payload.user_id as string) ??
		(payload.discord_id as string) ??
		(payload.bot_id as string) ??
		"—"
	);
}

// Derive a readable "impact target" from event metadata
function formatTarget(event: GuildEventModel): string {
	const payload = { ...asRecord(event.data), ...asRecord(event.metadata) };
	return (
		(payload.target_name as string) ??
		(payload.name as string) ??
		(payload.username as string) ??
		(payload.queue_name as string) ??
		(payload.channel_id ? `Channel ${payload.channel_id}` : null) ??
		"—"
	);
}

export default function Page() {
	const { data: rows = [], error, isLoading, isValidating, mutate } = useGuildData<GuildEventModel[]>("events?limit=100");
	const [searchQuery, setSearchQuery] = useState("");

	const filtered = rows.filter((e) => {
		const q = searchQuery.toLowerCase();
		return (
			!q ||
			e.event_type.toLowerCase().includes(q) ||
			formatInitiator(e).toLowerCase().includes(q) ||
			String(e.id).includes(q) ||
			formatTarget(e).toLowerCase().includes(q)
		);
	});

	return (
		<PageShell eyebrow="Networking" title="Audit Logs" actions={<RefreshButton onClick={() => mutate()} refreshing={isValidating && !isLoading} />}>

			<SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by initiator id, event type or target..." />

			<TableState loading={isLoading} error={error}>
				<DataTable columns={["Event ID", "Initiator", "Action Committed", "Impact Target", { label: "Timestamp", right: true }]} empty="No audit events recorded yet." isEmpty={filtered.length === 0} footer={<><span>Showing {filtered.length} of {rows.length} events</span>
							<span>Sourced from guild_events table</span></>}>
								{filtered.map((e) => (
									<tr key={e.id} className="hover:bg-panel-bg/10 transition-colors">
										<td className="p-4 font-bold text-fg-default">EVT-{e.id}</td>
										<td className="p-4 font-bold text-fg-muted truncate max-w-[100px]">{formatInitiator(e)}</td>
										<td className="p-4 text-fg-default">{formatEventType(e.event_type)}</td>
										<td className="p-4 text-fg-muted truncate max-w-[160px]">{formatTarget(e)}</td>
										<td className="p-4 text-right text-fg-muted whitespace-nowrap">
											<span title={new Date(e.created_at).toLocaleString()}>{relativeTime(e.created_at)}</span>
										</td>
									</tr>
								))}
				</DataTable>
			</TableState>

			<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl">
				<p className="text-xs text-fg-muted leading-relaxed">
					Audit events are stored in the <code className="text-primary-400">guild_events</code> table. Each event records the Discord user, action type, and related details. Events are created by the bot for config changes, moderation actions, and system operations.
				</p>
			</div>
		</PageShell>
	);
}
