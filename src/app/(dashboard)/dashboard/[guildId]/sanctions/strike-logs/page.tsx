"use client";

import { Ban, Loader2, RefreshCw, RotateCcw, Search, ShieldX, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import type { PlayerStrikeModel } from "@/lib/db-types";

type StrikeFilter = "ALL" | "ACTIVE" | "APPEALED" | "VOIDED" | "EXPIRED" | "TEMPLATE";

function strikeState(s: PlayerStrikeModel): Exclude<StrikeFilter, "ALL"> {
	if (s.is_template) return "TEMPLATE";
	if (s.is_voided) return "VOIDED";
	if (s.is_appealed) return "APPEALED";
	if (!s.is_enabled) return "EXPIRED";
	if (s.expires_at && new Date(s.expires_at) < new Date()) return "EXPIRED";
	return "ACTIVE";
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

const STATUS_CLASS: Record<Exclude<StrikeFilter, "ALL">, string> = {
	ACTIVE: "text-red-500 bg-red-500/10 border border-red-500/20",
	APPEALED: "text-amber-500 bg-amber-500/10 border border-amber-500/20",
	VOIDED: "text-cyan-500 bg-cyan-500/10 border border-cyan-500/20",
	EXPIRED: "text-fg-muted bg-panel-bg border border-border-subtle",
	TEMPLATE: "text-violet-500 bg-violet-500/10 border border-violet-500/20",
};

export default function Page() {
	const { dbGuildId } = useGuildConfig();
	const [logs, setLogs] = useState<PlayerStrikeModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [stateFilter, setStateFilter] = useState<StrikeFilter>("ALL");

	const load = useCallback(async (isRefresh = false) => {
		if (!dbGuildId) return;
		if (isRefresh) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/db/guilds/${dbGuildId}/strikes?limit=200`);
			if (!res.ok) throw new Error(`${res.status}`);
			const data = await res.json();
			setLogs(data.data ?? []);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [dbGuildId]);

	useEffect(() => { load(); }, [load]);

	const filtered = logs.filter((s) => {
		const state = strikeState(s);
		if (stateFilter !== "ALL" && state !== stateFilter) return false;
		const q = searchQuery.toLowerCase();
		return !q || s.reason.toLowerCase().includes(q) || s.staff_id.toLowerCase().includes(q) || String(s.id).includes(q) || String(s.player_id).includes(q);
	});

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Sanctions Ledger (player_strikes)</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Strike Logs</h2>
				</div>
				<button onClick={() => load(true)} disabled={refreshing} className="h-9 px-4 flex items-center gap-2 border border-border-subtle bg-panel-bg/40 text-fg-default font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all hover:bg-panel-bg active:scale-98 cursor-pointer shadow-sm disabled:opacity-60 self-start sm:self-auto">
					<RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary-500" : "text-fg-muted"}`} />
					<span>Refresh</span>
				</button>
			</div>

			<div className="flex flex-col sm:flex-row gap-3">
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
					<input type="text" placeholder="Search by player id, staff, reason or id..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 bg-panel-bg/20 border border-border-subtle rounded-xl font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50" />
				</div>
				<div className="flex bg-panel-bg/20 border border-border-subtle/60 rounded-xl p-1 h-10 overflow-x-auto">
					{(["ALL", "ACTIVE", "APPEALED", "VOIDED", "EXPIRED", "TEMPLATE"] as StrikeFilter[]).map((st) => (
						<button key={st} onClick={() => setStateFilter(st)} className={`h-full px-3 rounded-lg font-mono text-[9px] font-black uppercase tracking-wide transition-all cursor-pointer whitespace-nowrap ${stateFilter === st ? "bg-panel-bg border border-border-subtle text-fg-default shadow-xs" : "text-fg-muted hover:text-fg-default"}`}>{st}</button>
					))}
				</div>
			</div>

			{loading && <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-primary-500" /></div>}
			{error && <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger font-mono text-xs uppercase">{error}</div>}

			{!loading && !error && (
				<div className="border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-left font-mono text-[11px] border-collapse">
							<thead>
								<tr className="border-b border-border-subtle bg-bg-canvas/50 uppercase text-fg-muted text-[9px] font-black tracking-widest">
									<th className="p-4">Strike ID</th><th className="p-4">Player</th><th className="p-4">Lvl / Wt</th><th className="p-4">Reason</th><th className="p-4">Staff</th><th className="p-4">Elo Trail</th><th className="p-4">Penalties</th><th className="p-4">State</th><th className="p-4">Expiry</th><th className="p-4 text-right">Age</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border-subtle/40">
								{filtered.map((s) => {
									const state = strikeState(s);
									return (
										<tr key={s.id} className="hover:bg-panel-bg/10 transition-colors">
											<td className="p-4 font-bold text-fg-default">ST-{s.id}</td>
											<td className="p-4 font-bold text-fg-muted truncate max-w-[90px]">{s.player_id}</td>
											<td className="p-4 text-fg-muted">{s.level !== null && s.level !== undefined ? `L${s.level}` : "-"} / {s.weight}w</td>
											<td className="p-4 text-fg-muted max-w-[180px] truncate">{s.reason}</td>
											<td className="p-4 text-fg-muted">{s.staff_id}</td>
											<td className="p-4 text-fg-default font-bold whitespace-nowrap">
												{s.elo_old}<span className="text-fg-muted/50">→</span>{s.elo_new}{s.elo_removal > 0 && <span className="text-red-400"> (-{s.elo_removal})</span>}
											</td>
											<td className="p-4 text-fg-muted whitespace-nowrap">
												{s.ban_days > 0 && <span className="inline-flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-red-500 bg-red-500/10 border border-red-500/20"><Ban className="size-2.5" />{s.ban_days}d</span>}
												{s.restriction_role_name && <span className="inline-flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20">{s.restriction_role_name}</span>}
												{s.debuff_until && <span className="inline-flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-cyan-500 bg-cyan-500/10 border border-cyan-500/20"><Timer className="size-2.5" />debuff</span>}
												{s.disqualified_until && <span className="inline-flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-violet-500 bg-violet-500/10 border border-violet-500/20"><ShieldX className="size-2.5" />disq</span>}
												{!s.ban_days && !s.restriction_role_name && !s.debuff_until && !s.disqualified_until && "-"}
											</td>
											<td className="p-4"><span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${STATUS_CLASS[state]}`}>{state}</span></td>
											<td className="p-4 text-fg-muted">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "-"}</td>
											<td className="p-4 text-right text-fg-muted">{relativeTime(s.created_at)}</td>
										</tr>
									);
								})}
								{filtered.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-fg-muted uppercase text-[10px]">No matching strike rows</td></tr>}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<div className="flex flex-wrap items-center gap-3 p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl">
				<span className="font-mono text-[9px] font-bold text-fg-default uppercase tracking-wider flex items-center gap-1.5"><RotateCcw className="size-3 text-cyan-500" /> Row Semantics</span>
				<span className="font-mono text-[9px] text-fg-muted uppercase tracking-wide">Appealed rows remain live until resolved. Voided rows are removed from escalation math. Templates are ladder step rows the ledger broadcasts against.</span>
			</div>
		</div>
	);
}
