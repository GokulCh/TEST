"use client";

import { CheckCircle2, Clock, Eye, GitCompare, Map, Play, Search, SlidersHorizontal, XCircle } from "lucide-react";
import { useState } from "react";
import { CompareToggle, LoadingBlock, RefreshButton } from "@/components/panel/data-table";
import { useGuildData } from "@/hooks/use-guild-data";
import { relativeTime } from "@/lib/format";
import type { GameModel, GameParticipantModel } from "@/lib/db-types";

import { PageShell } from "@/components/panel/page-shell";
type StatusFilter = "ALL" | "in_progress" | "completed" | "waiting" | "cancelled";
type SortOption = "NEWEST" | "OLDEST";

type GameWithParticipants = GameModel & {
	participants?: Array<GameParticipantModel & { username?: string }>;
};

function elapsedSince(ts: string | null): string {
	if (!ts) return "—";
	const diff = Date.now() - new Date(ts).getTime();
	const m = Math.floor(diff / 60000);
	const s = Math.floor((diff % 60000) / 1000);
	if (m < 60) return `${m}m ${s}s`;
	return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
	in_progress: <Play className="size-4 animate-pulse fill-current" />,
	waiting: <Clock className="size-4" />,
	completed: <CheckCircle2 className="size-4" />,
	cancelled: <XCircle className="size-4" />,
};

const STATUS_COLOR: Record<string, string> = {
	in_progress: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
	waiting: "bg-amber-500/10 border-amber-500/20 text-amber-400",
	completed: "bg-success/10 border-success/20 text-success",
	cancelled: "bg-rose-500/10 border-rose-500/20 text-rose-400",
};

const STATUS_BADGE: Record<string, string> = {
	in_progress: "text-cyan-400 bg-cyan-500/10",
	waiting: "text-amber-400 bg-amber-500/10",
	completed: "text-success bg-success/10",
	cancelled: "text-rose-400 bg-rose-500/10",
};

export default function Page() {
	// Games with participants for the first 20 (the route caps participant lookups), 50 games in all.
	const { data, error: loadError, isLoading: loading, isValidating, mutate } = useGuildData<{ games: GameWithParticipants[] }>("games?limit=50&participants=true");
	const games = data?.games ?? [];
	const error = loadError ? loadError.message : null;
	const refreshing = isValidating && !loading;

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [currentSort, setCurrentSort] = useState<SortOption>("NEWEST");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [compareMode, setCompareMode] = useState(false);
	const [compareId, setCompareId] = useState<string | null>(null);
	const inspectedId = selectedId ?? games[0]?.id ?? null;

	// Derive map name / mode from meta IDs — we just show the IDs since meta is loaded separately
	const processed = games
		.filter((g) => {
			const matchesStatus = statusFilter === "ALL" || g.status === statusFilter;
			const q = searchQuery.toLowerCase();
			const matchesSearch = !q || String(g.id).includes(q) || (g.game_number !== null && String(g.game_number).includes(q));
			return matchesStatus && matchesSearch;
		})
		.sort((a, b) => {
			if (currentSort === "NEWEST") return Number(BigInt(b.id) - BigInt(a.id));
			return Number(BigInt(a.id) - BigInt(b.id));
		});

	const inspected = processed.find((g) => g.id === inspectedId) ?? null;
	const compared = processed.find((g) => g.id === compareId) ?? null;

	// Group participants by team for the inspector
	function teamMap(game: GameWithParticipants): Record<string, Array<GameParticipantModel & { username?: string }>> {
		const map: Record<string, Array<GameParticipantModel & { username?: string }>> = {};
		(game.participants ?? []).forEach((p) => {
			const t = p.team || "Unknown";
			if (!map[t]) map[t] = [];
			map[t].push(p);
		});
		return map;
	}

	const teamColors = ["text-indigo-400", "text-red-400", "text-emerald-400", "text-amber-400", "text-cyan-400"];

	return (
		<PageShell eyebrow="Live data" title="Games" actions={<><CompareToggle active={compareMode} onToggle={() => setCompareMode(!compareMode)} /><RefreshButton onClick={() => mutate()} refreshing={refreshing} label="Sync Live Pools" /></>}>

			{/* Filters */}
			<div className="p-4 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-3 shadow-sm">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
					<div className="relative lg:col-span-6">
						<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
						<input
							type="text"
							placeholder="Search by game id or game number..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full h-9 pl-9 pr-4 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
						/>
					</div>
					<div className="flex items-center gap-2 lg:col-span-3">
						<SlidersHorizontal className="size-3.5 text-fg-muted shrink-0" />
						<select value={currentSort} onChange={(e) => setCurrentSort(e.target.value as SortOption)} className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15">
							<option value="NEWEST">Sort: Newest</option>
							<option value="OLDEST">Sort: Oldest</option>
						</select>
					</div>
					<div className="flex items-center gap-2 lg:col-span-3">
						<Map className="size-3.5 text-fg-muted shrink-0" />
						<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15">
							<option value="ALL">All Statuses</option>
							<option value="in_progress">In progress</option>
							<option value="waiting">Waiting</option>
							<option value="completed">Completed</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>
			</div>

			{loading && <LoadingBlock />}
			{error && <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-xs">{error}</div>}

				{!loading && !error && processed.length === 0 && (
					<div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center text-xs text-fg-muted">
						No match instances found.
					</div>
				)}

				{!loading && !error && processed.length > 0 && (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Game list */}
					<div className="lg:col-span-2 space-y-2 max-h-[580px] overflow-y-auto pr-1">
						<div className="px-1 flex justify-between text-xs font-medium text-fg-muted">
							<span>Match Instances ({processed.length})</span>
							<span>Status · Started</span>
						</div>



						{processed.map((game) => (
							<div
								key={game.id}
								onClick={() => setSelectedId(game.id)}
								className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group text-left ${inspectedId === game.id ? "bg-primary-500/5 border-primary-500/30 shadow-xs" : "border-border-subtle/50 bg-bg-canvas/10 hover:bg-bg-canvas/30"}`}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div className={`size-9 rounded-lg border flex items-center justify-center shrink-0 ${STATUS_COLOR[game.status] ?? STATUS_COLOR.cancelled}`}>
										{STATUS_ICON[game.status] ?? <XCircle className="size-4" />}
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="text-[13px] font-semibold text-fg-default">
												{game.game_number !== null ? `Game #${game.game_number}` : `ID ${game.id}`}
											</span>
										</div>
										<span className="block text-xs text-fg-muted/60">
											{game.participants?.length ?? 0} participants · {relativeTime(game.started_at ?? game.ended_at)}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-4 text-right font-mono shrink-0">
									<div className="hidden sm:block space-y-0.5">
										<span className="block text-xs font-medium text-fg-muted">Started</span>
										<span className="text-[10px] font-bold text-fg-default flex items-center justify-end gap-1">
											<Clock className="size-2.5 text-fg-muted" />{relativeTime(game.started_at)}
										</span>
									</div>
									<div className="w-20">
										<span className="block text-xs font-medium text-fg-muted">Status</span>
										<span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STATUS_BADGE[game.status] ?? ""}`}>
											{game.status}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Inspector / Compare */}
					<div className="space-y-4">
						{compareMode ? (
							<div className="p-4 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 text-left">
								<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
									<GitCompare className="size-4 text-primary-500" />
									<h3 className="text-[13px] font-semibold text-fg-default">Match Comparison</h3>
								</div>
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">Secondary Match</label>
									<select value={compareId ?? ""} onChange={(e) => setCompareId(e.target.value)} className="w-full h-8 px-2 bg-bg-canvas/60 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
										{processed.map((g) => (
											<option key={g.id} value={g.id}>
												{g.game_number !== null ? `#${g.game_number}` : `ID ${g.id}`} ({g.status})
											</option>
										))}
									</select>
								</div>
								{inspected && compared && (
									<div className="space-y-2 pt-2 border-t border-border-subtle/30 text-xs">
										<div className="grid grid-cols-3 text-center font-bold text-fg-muted text-[8px] tracking-widest border-b border-border-subtle/20 pb-1">
											<span>{inspected.game_number ?? inspected.id}</span>
											<span className="text-primary-500">VARS</span>
											<span>{compared.game_number ?? compared.id}</span>
										</div>
										{[
											{ label: "STATUS", a: inspected.status, b: compared.status },
											{ label: "PLAYERS", a: inspected.participants?.length ?? "—", b: compared.participants?.length ?? "—" },
											{ label: "STARTED", a: relativeTime(inspected.started_at), b: relativeTime(compared.started_at) },
										].map(({ label, a, b }) => (
											<div key={label} className="grid grid-cols-3 text-center py-1 odd:bg-bg-canvas/20 rounded-sm">
												<span className="font-semibold text-fg-default truncate">{a}</span>
												<span className="text-fg-muted/40 font-bold text-[8px]">{label}</span>
												<span className="font-semibold text-fg-default truncate">{b}</span>
											</div>
										))}
									</div>
								)}
							</div>
						) : inspected ? (
							<div className="rounded-xl border border-border-subtle bg-panel-bg/40 p-5 space-y-4 shadow-sm text-left">
								<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
									<div className="flex items-center gap-2">
										<Eye className="size-3.5 text-fg-muted" />
										<h3 className="text-xs font-medium text-fg-muted">Match Inspector</h3>
									</div>
									<span className={`text-xs font-medium px-1.5 py-0.5 rounded ${STATUS_BADGE[inspected.status] ?? ""}`}>
										{inspected.status}
									</span>
								</div>

								<div className="space-y-3 font-mono">
									<div>
										<h4 className="text-sm font-semibold text-fg-default leading-none">
											{inspected.game_number !== null ? `Game #${inspected.game_number}` : `Game ${inspected.id}`}
										</h4>
										<span className="text-xs text-fg-muted block mt-1">
											ID: {inspected.id}
										</span>
									</div>

									{/* Teams */}
									{(inspected.participants ?? []).length > 0 && (
										<div className="space-y-2 pt-2 border-t border-border-subtle/30">
											<span className="block text-xs font-medium text-primary-500">Balanced Team Formations</span>
											{Object.entries(teamMap(inspected)).map(([team, members], ti) => (
												<div key={team} className="p-2 bg-bg-canvas/40 border border-border-subtle/60 rounded-lg text-left space-y-1">
													<span className={`block text-xs font-medium ${teamColors[ti % teamColors.length]}`}>{team} Team</span>
													<div className="text-[13px] font-semibold text-fg-default truncate">
														{members.map((m) => m.username || m.player_id).join(", ")}
													</div>
													{members.some((m) => m.is_winner) && (
														<span className="text-xs font-medium text-success bg-success/10 px-1 rounded capitalize">Winner</span>
													)}
												</div>
											))}
										</div>
									)}

									{/* Runtime metadata */}
									<div className="pt-2 border-t border-border-subtle/30 space-y-1.5">
										<span className="block text-xs font-medium text-fg-muted">Runtime Metadata</span>
										<div className="p-2 bg-bg-canvas/20 rounded border border-border-subtle/40 text-xs text-fg-muted space-y-1">
											<div className="flex justify-between"><span>Started:</span><span className="text-fg-default font-bold">{inspected.started_at ? new Date(inspected.started_at).toLocaleString() : "—"}</span></div>
											<div className="flex justify-between"><span>Ended:</span><span className="text-fg-default font-bold">{inspected.ended_at ? new Date(inspected.ended_at).toLocaleString() : "—"}</span></div>
											{inspected.status === "in_progress" && inspected.started_at && (
												<div className="flex justify-between"><span>Elapsed:</span><span className="text-cyan-400 font-bold">{elapsedSince(inspected.started_at)}</span></div>
											)}
											<div className="flex justify-between"><span>Participants:</span><span className="text-fg-default font-bold">{inspected.participants?.length ?? "—"}</span></div>
										</div>
									</div>
								</div>
							</div>
						) : null}
					</div>
						</div>
					)}
			</PageShell>
		);
}