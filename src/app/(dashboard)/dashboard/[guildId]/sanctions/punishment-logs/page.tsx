"use client";

import { useState } from "react";
import { useGuildData } from "@/hooks/use-guild-data";
import { relativeTime } from "@/lib/format";
import type { PlayerPunishmentModel } from "@/lib/db-types";

import { DataTable, RefreshButton, SearchInput, TableState } from "@/components/panel/data-table";
import { PageShell } from "@/components/panel/page-shell";
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
	const { data: rows = [], error, isLoading, isValidating, mutate } = useGuildData<PlayerPunishmentModel[]>("punishments?limit=200");
	const [searchQuery, setSearchQuery] = useState("");
	const [actionFilter, setActionFilter] = useState("ALL");

	const filtered = rows.filter((p) => {
		const q = searchQuery.toLowerCase();
		const matchesSearch = !q || p.reason.toLowerCase().includes(q) || p.staff_id.toLowerCase().includes(q) || String(p.id).includes(q) || String(p.player_id).includes(q);
		const matchesType = actionFilter === "ALL" || (actionFilter === "BAN" && p.type === "server_ban") || (actionFilter === "LOCKOUT" && p.type === "queue_ban") || (actionFilter === "MUTE" && (p.type === "chat_mute" || p.type === "vc_mute"));
		return matchesSearch && matchesType;
	});

	return (
		<PageShell eyebrow="Sanctions" title="Punishment History" actions={<RefreshButton onClick={() => mutate()} refreshing={isValidating && !isLoading} />}>

			<div className="flex flex-col sm:flex-row gap-3">
				<SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search by player id, reason or id..." />
				<select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="h-10 px-3 bg-panel-bg/20 border border-border-subtle rounded-xl font-mono text-xs text-fg-default focus:outline-none">
					<option value="ALL">All Punishment Types</option>
					<option value="BAN">Server Bans</option>
					<option value="LOCKOUT">Queue Bans</option>
					<option value="MUTE">Mutes</option>
				</select>
			</div>

			<TableState loading={isLoading} error={error}>
				<DataTable columns={["ID", "Player", "Type", "Reason", "Evidence", "Enforcer", "Duration", "Revoked", "State", { label: "Age", right: true }]} empty="No matching punishment rows" isEmpty={filtered.length === 0}>
								{filtered.map((p) => {
									const state = punishmentState(p);
									return (
										<tr key={p.id} className="hover:bg-panel-bg/10 transition-colors">
											<td className="p-4 font-bold text-fg-default">PUN-{p.id}</td>
											<td className="p-4 font-bold text-fg-muted truncate max-w-[90px]">{p.player_id}</td>
											<td className="p-4"><span className={`inline-block font-medium px-1.5 py-0.5 rounded text-xs ${TYPE_CLASS[p.type] ?? ""}`}>{p.type}</span></td>
											<td className="p-4 text-fg-muted max-w-[200px] truncate">{p.reason}</td>
											<td className="p-4 text-fg-muted">{p.evidence ?? "-"}</td>
											<td className="p-4 text-fg-muted">{p.staff_id}</td>
											<td className="p-4 text-fg-default font-bold">{formatDuration(p.expires_at)}</td>
											<td className="p-4 text-fg-muted">{p.revoked_by ?? "-"}</td>
											<td className="p-4"><span className={`inline-block font-medium px-1.5 py-0.5 rounded text-xs ${STATE_CLASS[state]}`}>{state}</span></td>
											<td className="p-4 text-right text-fg-muted">{relativeTime(p.created_at)}</td>
										</tr>
									);
								})}
				</DataTable>
			</TableState>

			<div className="p-4 border border-dashed border-border-subtle bg-panel-bg/5 rounded-xl">
				<p className="text-xs text-fg-muted leading-relaxed">
					Punishments expire based on their end date. Revoked punishments are removed and no longer block players from queuing.
				</p>
			</div>
		</PageShell>
	);
}
