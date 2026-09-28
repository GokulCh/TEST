"use client";

import { Lock, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useGuildData } from "@/hooks/use-guild-data";
import { relativeTime } from "@/lib/format";
import type { PlayerStrikeModel } from "@/lib/db-types";

import { DataTable, RefreshButton, SearchInput, TableState } from "@/components/panel/data-table";
import { PageShell } from "@/components/panel/page-shell";
import { NoteCard } from "@/components/panel/form-parts";

const STATES = ["ACTIVE", "APPEALED", "VOIDED", "EXPIRED"] as const;
type StrikeState = (typeof STATES)[number];

function strikeState(s: PlayerStrikeModel): StrikeState {
	if (s.is_voided) return "VOIDED";
	if (s.is_appealed) return "APPEALED";
	if (!s.is_enabled) return "EXPIRED";
	if (s.expires_at && new Date(s.expires_at) < new Date()) return "EXPIRED";
	return "ACTIVE";
}

const STATUS_CLASS: Record<StrikeState, string> = {
	ACTIVE: "text-red-500 bg-red-500/10 border border-red-500/20",
	APPEALED: "text-amber-500 bg-amber-500/10 border border-amber-500/20",
	VOIDED: "text-cyan-500 bg-cyan-500/10 border border-cyan-500/20",
	EXPIRED: "text-fg-muted bg-panel-bg border border-border-subtle",
};

export default function Page() {
	const { data: rows = [], error, isLoading, isValidating, mutate } = useGuildData<PlayerStrikeModel[]>("strikes?limit=200");
	const [searchQuery, setSearchQuery] = useState("");
	const [stateFilter, setStateFilter] = useState<StrikeState | "ALL">("ALL");

	const filtered = rows.filter((s) => {
		if (stateFilter !== "ALL" && strikeState(s) !== stateFilter) return false;
		const q = searchQuery.toLowerCase();
		return !q || s.reason.toLowerCase().includes(q) || s.staff_id.toLowerCase().includes(q) || String(s.id).includes(q) || String(s.player_id).includes(q);
	});

	return (
		<PageShell eyebrow="Sanctions" title="Strike Logs" actions={<RefreshButton onClick={() => mutate()} refreshing={isValidating && !isLoading} />}>
			<div className="flex flex-col sm:flex-row gap-3">
				<SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by player id, staff, reason or id..." />
				<div className="flex bg-panel-bg/20 border border-border-subtle/60 rounded-xl p-1 h-10 overflow-x-auto">
					{(["ALL", ...STATES] as const).map((st) => (
						<button key={st} onClick={() => setStateFilter(st)} className={`h-full px-3 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${stateFilter === st ? "bg-panel-bg border border-border-subtle text-fg-default shadow-xs" : "text-fg-muted hover:text-fg-default"}`}>{st}</button>
					))}
				</div>
			</div>

			<TableState loading={isLoading} error={error}>
				<DataTable columns={["Strike ID", "Player", "Reason", "Staff", "Elo Trail", "Restriction", "State", "Expiry", { label: "Age", right: true }]} empty="No matching strike rows" isEmpty={filtered.length === 0}>
					{filtered.map((s) => {
						const state = strikeState(s);
						const restricted = s.is_queue_restricted && (!s.restricted_until || new Date(s.restricted_until) > new Date());
						return (
							<tr key={s.id} className="hover:bg-panel-bg/10 transition-colors">
								<td className="p-4 font-bold text-fg-default">ST-{s.id}</td>
								<td className="p-4 font-bold text-fg-muted truncate max-w-[90px]">{s.player_id}</td>
								<td className="p-4 text-fg-muted max-w-[180px] truncate">{s.reason}</td>
								<td className="p-4 text-fg-muted">{s.staff_id}</td>
								<td className="p-4 text-fg-default font-bold whitespace-nowrap">
									{s.elo_old}<span className="text-fg-muted/50">→</span>{s.elo_new}
									{!!s.elo_change && <span className="text-red-400"> ({s.elo_change > 0 ? "+" : ""}{s.elo_change})</span>}
								</td>
								<td className="p-4 text-fg-muted whitespace-nowrap">
									{restricted ? (
										<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 capitalize">
											<Lock className="size-2.5" />
											{s.restricted_until ? `until ${new Date(s.restricted_until).toLocaleDateString()}` : "queue"}
										</span>
									) : (
										"-"
									)}
								</td>
								<td className="p-4"><span className={`inline-block font-medium px-1.5 py-0.5 rounded text-xs ${STATUS_CLASS[state]}`}>{state}</span></td>
								<td className="p-4 text-fg-muted">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "-"}</td>
								<td className="p-4 text-right text-fg-muted">{relativeTime(s.created_at)}</td>
							</tr>
						);
					})}
				</DataTable>
			</TableState>

			<NoteCard icon={<RotateCcw className="size-3.5 text-cyan-500" />} title="Row Semantics">
				Appealed rows remain live until resolved. Voided rows are removed from escalation math.
			</NoteCard>
		</PageShell>
	);
}
