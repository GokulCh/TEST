"use client";

import { Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import type { GuildEventModel } from "@/lib/db-types";

function relativeTime(ts: string): string {
	const diff = Date.now() - new Date(ts).getTime();
	const m = Math.floor(diff / 60000);
	if (m < 2) return "just now";
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}

// Format the event type into a human-readable action label
function formatEventType(type: string): string {
	return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Derive a readable "impact target" from event metadata
function formatTarget(event: GuildEventModel): string {
	if (!event.metadata || typeof event.metadata !== "object") return "—";
	const meta = event.metadata as Record<string, unknown>;
	return (
		(meta.target_name as string) ??
		(meta.name as string) ??
		(meta.username as string) ??
		(meta.queue_name as string) ??
		(meta.channel_id ? `Channel ${meta.channel_id}` : null) ??
		"—"
	);
}

const STATUS_CLASS: Record<string, string> = {
	active: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
	resolved: "text-success bg-success/10 border border-success/20",
	cancelled: "text-fg-muted bg-panel-bg border border-border-subtle",
};

export default function Page() {
	const { dbGuildId } = useGuildConfig();

	const [events, setEvents] = useState<GuildEventModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const load = useCallback(async (isRefresh = false) => {
		if (!dbGuildId) return;
		if (isRefresh) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/events?limit=100`);
			if (!res.ok) throw new Error(`${res.status}`);
			const data = await res.json();
			setEvents(data.data ?? []);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load audit events");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [dbGuildId]);

	useEffect(() => { load(); }, [load]);

	const filtered = events.filter((e) => {
		const q = searchQuery.toLowerCase();
		return (
			!q ||
			e.type.toLowerCase().includes(q) ||
			e.initiator_id.toLowerCase().includes(q) ||
			String(e.id).includes(q) ||
			formatTarget(e).toLowerCase().includes(q)
		);
	});

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Gateway System Audits (guild_events)</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Audit Tracing Timeline</h2>
				</div>
				<button
					onClick={() => load(true)}
					disabled={refreshing}
					className="h-9 px-4 flex items-center gap-2 border border-border-subtle bg-panel-bg/40 text-fg-default font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all hover:bg-panel-bg active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 self-start sm:self-auto"
				>
					<RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary-500" : "text-fg-muted"}`} />
					<span>Refresh</span>
				</button>
			</div>

			<div className="relative">
				<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
				<input
					type="text"
					placeholder="Search by initiator id, event type or target..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full h-10 pl-10 pr-4 bg-panel-bg/20 border border-border-subtle rounded-xl font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
				/>
			</div>

			{loading && <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-primary-500" /></div>}
			{error && <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger font-mono text-xs uppercase">{error}</div>}

			{!loading && !error && (
				<div className="border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left font-mono text-[11px] border-collapse">
							<thead>
								<tr className="border-b border-border-subtle bg-bg-canvas/50 uppercase text-fg-muted text-[9px] font-black tracking-widest">
									<th className="p-4">Event ID</th>
									<th className="p-4">Initiator</th>
									<th className="p-4">Action Committed</th>
									<th className="p-4">Impact Target</th>
									<th className="p-4">Status</th>
									<th className="p-4 text-right">Timestamp</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border-subtle/40">
								{filtered.map((e) => (
									<tr key={e.id} className="hover:bg-panel-bg/10 transition-colors">
										<td className="p-4 font-bold text-fg-default">EVT-{e.id}</td>
										<td className="p-4 font-bold text-fg-muted truncate max-w-[100px]">{e.initiator_id}</td>
										<td className="p-4 text-fg-default">{formatEventType(e.type)}</td>
										<td className="p-4 text-fg-muted truncate max-w-[160px]">{formatTarget(e)}</td>
										<td className="p-4">
											<span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${STATUS_CLASS[e.status] ?? STATUS_CLASS.cancelled}`}>
												{e.status}
											</span>
										</td>
										<td className="p-4 text-right text-fg-muted whitespace-nowrap">
											<span title={new Date(e.created_at).toLocaleString()}>{relativeTime(e.created_at)}</span>
										</td>
									</tr>
								))}

								{filtered.length === 0 && (
									<tr>
										<td colSpan={6} className="p-8 text-center text-fg-muted uppercase text-[10px]">
											No audit events recorded yet.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{events.length > 0 && (
						<div className="px-4 py-2 border-t border-border-subtle/40 flex items-center justify-between text-[9px] font-mono font-bold text-fg-muted uppercase tracking-wider">
							<span>Showing {filtered.length} of {events.length} events</span>
							<span>Sourced from guild_events table</span>
						</div>
					)}
				</div>
			)}

			<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl">
				<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
					Audit events are sourced from the <code className="text-primary-400">guild_events</code> table. Each event records the initiating Discord user, the action type, and associated metadata. Events are created by the bot engine on config changes, moderation actions, and system operations.
				</p>
			</div>
		</div>
	);
}
