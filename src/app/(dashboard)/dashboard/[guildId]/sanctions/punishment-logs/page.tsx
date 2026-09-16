"use client";

import { Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import type { PlayerPunishmentModel } from "@/lib/db-types";

type LogState = "ACTIVE" | "REVOKED" | "EXPIRED" | "DISABLED";

function punishmentState(p: PlayerPunishmentModel): LogState {
	if (!p.is_enabled) return "DISABLED";
	if (p.revoked_by) return "REVOKED";
	if (p.expires_at && new Date(p.expires_at) < new Date()) return "EXPIRED";
	return "ACTIVE";
}

function formatDuration(expiresAt: string | null): string {
	if (!expiresAt) return "Permanent";
	const ms = new Date(expiresAt).getTime() - Date.now();
	if (ms <= 0) return "Expired";
	const h = Math.floor(ms / 3600000);
	return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

function relativeTime(ts: string): string {
	const diff = Date.now() - new Date(ts).getTime();
	const m = Math.floor(diff / 60000);
	if (m < 2) return "just now";
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}

const TYPE_CLASS: Record<string, string> = {
	warning: "text-fg-muted bg-panel-bg border border-border-subtle",
	chat_mute: "text-cyan-500 bg-cyan-500/10 border border-cyan-500/20",
	vc_mute: "text-cyan-500 bg-cyan-500/10 border border-cyan-500/20",
	queue_ban: "text-amber-500 bg-amber-500/10 border border-amber-500/20",
	server_ban: "text-red-500 bg-red-500/10 border border-red-500/20",
	restrict: "text-violet-500 bg-violet-500/10 border border-violet-500/20",
};

const STATE_CLASS: Record<LogState, string> = {
	ACTIVE: "text-red-500 bg-red-500/10 border border-red-500/20",
	REVOKED: "text-cyan-500 bg-cyan-500/10 border border-cyan-500/20",
	EXPIRED: "text-fg-muted bg-panel-bg border border-border-subtle",
	DISABLED: "text-amber-500 bg-amber-500/10 border border-amber-500/20",
};

export default function Page() {
	const { dbGuildId } = useGuildConfig();
	const [logs, setLogs] = useState<PlayerPunishmentModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [actionFilter, setActionFilter] = useState("ALL");

	const load = useCallback(async (isRefresh = false) => {
		if (!dbGuildId) return;
		if (isRefresh) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/punishments?limit=200`);
			if (!res.ok) throw new Error(`${res.status}`);
			const data = await res.json();
			setLogs(data.data ?? []);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load");
		} finally { setLoading(false); setRefreshing(false); }
	}, [dbGuildId]);

	useEffect(() => { load(); }, [load]);

	const filtered = logs.filter((p) => {
		const q = searchQuery.toLowerCase();
		const matchesSearch = !q || p.reason.toLowerCase().includes(q) || p.staff_id.toLowerCase().includes(q) || String(p.id).includes(q) || String(p.player_id).includes(q);
		const matchesType = actionFilter === "ALL" || (actionFilter === "BAN" && p.type === "server_ban") || (actionFilter === "LOCKOUT" && p.type === "queue_ban") || (actionFilter === "MUTE" && (p.type === "chat_mute" || p.type === "vc_mute"));
		return matchesSearch && matchesType;
	});

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Sanctions Ledger (player_punishments)</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Punishment Logs</h2>
				</div>
				<button onClick={() => load(true)} disabled={refreshing} className="h-9 px-4 flex items-center gap-2 border border-border-subtle bg-panel-bg/40 text-fg-default font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all hover:bg-panel-bg active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 self-start sm:self-auto">
					<RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary-500" : "text-fg-muted"}`} />
					<span>Refresh</span>
				</button>
			</div>

			<div className="flex flex-col sm:flex-row gap-3">
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
					<input type="text" placeholder="Search by player id, reason or id..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 bg-panel-bg/20 border border-border-subtle rounded-xl font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
				</div>
				<select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="h-10 px-3 bg-panel-bg/20 border border-border-subtle rounded-xl font-mono text-xs text-fg-default focus:outline-none">
					<option value="ALL">All Punishment Types</option>
					<option value="BAN">Server Bans</option>
					<option value="LOCKOUT">Queue Bans</option>
					<option value="MUTE">Mutes</option>
				</select>
			</div>

			{loading && <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-primary-500" /></div>}
			{error && <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger font-mono text-xs uppercase">{error}</div>}

			{!loading && !error && (
				<div className="border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left font-mono text-[11px] border-collapse">
							<thead>
								<tr className="border-b border-border-subtle bg-bg-canvas/50 uppercase text-fg-muted text-[9px] font-black tracking-widest">
									<th className="p-4">ID</th><th className="p-4">Player</th><th className="p-4">Type</th><th className="p-4">Reason</th><th className="p-4">Evidence</th><th className="p-4">Enforcer</th><th className="p-4">Duration</th><th className="p-4">Revoked</th><th className="p-4">State</th><th className="p-4 text-right">Age</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border-subtle/40">
								{filtered.map((p) => {
									const state = punishmentState(p);
									return (
										<tr key={p.id} className="hover:bg-panel-bg/10 transition-colors">
											<td className="p-4 font-bold text-fg-default">PUN-{p.id}</td>
											<td className="p-4 font-bold text-fg-muted truncate max-w-[90px]">{p.player_id}</td>
											<td className="p-4"><span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${TYPE_CLASS[p.type] ?? ""}`}>{p.type}</span></td>
											<td className="p-4 text-fg-muted max-w-[200px] truncate">{p.reason}</td>
											<td className="p-4 text-fg-muted">{p.evidence ?? "-"}</td>
											<td className="p-4 text-fg-muted">{p.staff_id}</td>
											<td className="p-4 text-fg-default font-bold">{formatDuration(p.expires_at)}</td>
											<td className="p-4 text-fg-muted">{p.revoked_by ?? "-"}</td>
											<td className="p-4"><span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${STATE_CLASS[state]}`}>{state}</span></td>
											<td className="p-4 text-right text-fg-muted">{relativeTime(p.created_at)}</td>
										</tr>
									);
								})}
								{filtered.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-fg-muted uppercase text-[10px]">No matching punishment rows</td></tr>}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl">
				<p className="font-mono text-[9px] text-fg-muted uppercase tracking-wide leading-relaxed">
					Expiry driven by expires_at. Revocations recorded with revoke_reason; revoked rows no longer gate queue access.
				</p>
			</div>
		</div>
	);
}
