"use client";

import {
	CheckCircle2,
	Clock,
	Eye,
	GitCompare,
	Loader2,
	Map,
	Play,
	RefreshCw,
	Scale,
	Search,
	SlidersHorizontal,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import type { GameModel, GameParticipantModel } from "@/lib/db-types";

type StatusFilter = "ALL" | "ongoing" | "completed" | "voided" | "waiting" | "cancelled";
type SortOption = "NEWEST" | "OLDEST";

type GameWithParticipants = GameModel & {
	participants?: Array<GameParticipantModel & { username?: string }>;
};

function relativeTime(ts: string | null): string {
	if (!ts) return "—";
	const diff = Date.now() - new Date(ts).getTime();
	const m = Math.floor(diff / 60000);
	if (m < 2) return "just now";
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	return `${Math.floor(h / 24)}d ago`;
}

function elapsedSince(ts: string | null): string {
	if (!ts) return "—";
	const diff = Date.now() - new Date(ts).getTime();
	const m = Math.floor(diff / 60000);
	const s = Math.floor((diff % 60000) / 1000);
	if (m < 60) return `${m}m ${s}s`;
	return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
	ongoing: <Play className="size-4 animate-pulse fill-current" />,
	waiting: <Clock className="size-4" />,
	starting: <Clock className="size-4" />,
	completed: <CheckCircle2 className="size-4" />,
	cancelled: <XCircle className="size-4" />,
	voided: <XCircle className="size-4" />,
};

const STATUS_COLOR: Record<string, string> = {
	ongoing: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
	waiting: "bg-amber-500/10 border-amber-500/20 text-amber-400",
	starting: "bg-amber-500/10 border-amber-500/20 text-amber-400",
	completed: "bg-success/10 border-success/20 text-success",
	cancelled: "bg-rose-500/10 border-rose-500/20 text-rose-400",
	voided: "bg-rose-500/10 border-rose-500/20 text-rose-400",
};

const STATUS_BADGE: Record<string, string> = {
	ongoing: "text-cyan-400 bg-cyan-500/10",
	waiting: "text-amber-400 bg-amber-500/10",
	starting: "text-amber-400 bg-amber-500/10",
	completed: "text-success bg-success/10",
	cancelled: "text-rose-400 bg-rose-500/10",
	voided: "text-rose-400 bg-rose-500/10",
};

export default function Page() {
	const { dbGuildId } = useGuildConfig();

	const [games, setGames] = useState<GameWithParticipants[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [currentSort, setCurrentSort] = useState<SortOption>("NEWEST");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [compareMode, setCompareMode] = useState(false);
	const [compareId, setCompareId] = useState<string | null>(null);

	const load = useCallback(async (isRefresh = false) => {
		if (!dbGuildId) return;
		if (isRefresh) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			// Load games with participants (cap at 20 for participant data, 50 total)
			const res = await fetch(`/api/db/guilds/${dbGuildId}/games?limit=50&participants=true`);
			if (!res.ok) throw new Error(`${res.status}`);
			const data = await res.json();
			const list: GameWithParticipants[] = data.data?.games ?? [];
			setGames(list);
			if (list.length > 0 && !selectedId) setSelectedId(list[0].id);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load games");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [dbGuildId]);

	useEffect(() => { load(); }, [load]);

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

	const inspected = processed.find((g) => g.id === selectedId) ?? null;
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
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">// Matchmaker Runtime Observability</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">Match Instances Command Desk</h2>
				</div>
				<div className="flex items-center gap-2 self-start sm:self-auto">
					<button
						onClick={() => setCompareMode(!compareMode)}
						className={`h-9 px-4 flex items-center gap-2 border font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-sm ${compareMode ? "bg-primary-500/10 border-primary-500/30 text-primary-500" : "border-border-subtle bg-panel-bg/40 text-fg-default hover:bg-panel-bg"}`}
					>
						<GitCompare className="size-3.5" />
						<span>{compareMode ? "Exit Compare" : "Cross-Compare"}</span>
					</button>
					<button
						onClick={() => load(true)}
						disabled={refreshing}
						className="h-9 px-4 flex items-center gap-2 border border-border-subtle bg-panel-bg/40 text-fg-default font-mono font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all hover:bg-panel-bg hover:border-primary-500/40 active:scale-98 cursor-pointer shadow-sm disabled:opacity-60"
					>
						<RefreshCw className={`size-3.5 text-fg-muted ${refreshing ? "animate-spin text-primary-500" : ""}`} />
						<span>Sync Live Pools</span>
					</button>
				</div>
			</div>

			{/* Filters */}
			<div className="p-4 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-3 shadow-sm">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
					<div className="relative lg:col-span-6">
						<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
						<input
							type="text"
							placeholder="Search by game id or game number..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full h-9 pl-9 pr-4 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
						/>
					</div>
					<div className="flex items-center gap-2 lg:col-span-3">
						<SlidersHorizontal className="size-3.5 text-fg-muted shrink-0" />
						<select value={currentSort} onChange={(e) => setCurrentSort(e.target.value as SortOption)} className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none">
							<option value="NEWEST">Sort: Newest</option>
							<option value="OLDEST">Sort: Oldest</option>
						</select>
					</div>
					<div className="flex items-center gap-2 lg:col-span-3">
						<Map className="size-3.5 text-fg-muted shrink-0" />
						<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none">
							<option value="ALL">All Statuses</option>
							<option value="ongoing">Ongoing</option>
							<option value="waiting">Waiting</option>
							<option value="completed">Completed</option>
							<option value="voided">Voided</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>
			</div>

			{loading && <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-primary-500" /></div>}
			{error && <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger font-mono text-xs uppercase">{error}</div>}

			{!loading && !error && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Game list */}
					<div className="lg:col-span-2 space-y-2 max-h-[580px] overflow-y-auto pr-1">
						<div className="px-1 flex justify-between font-mono text-[9px] font-bold text-fg-muted uppercase tracking-widest">
							<span>Match Instances ({processed.length})</span>
							<span>Status · Started</span>
						</div>

						{processed.length === 0 && (
							<div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center font-mono text-xs text-fg-muted uppercase tracking-wider">
								No match instances found.
							</div>
						)}

						{processed.map((game) => (
							<div
								key={game.id}
								onClick={() => setSelectedId(game.id)}
								className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group text-left ${selectedId === game.id ? "bg-primary-500/5 border-primary-500/30 shadow-xs" : "border-border-subtle/50 bg-bg-canvas/10 hover:bg-bg-canvas/30"}`}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div className={`size-9 rounded-lg border flex items-center justify-center shrink-0 ${STATUS_COLOR[game.status] ?? STATUS_COLOR.voided}`}>
										{STATUS_ICON[game.status] ?? <XCircle className="size-4" />}
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="font-mono text-xs font-black text-fg-default uppercase tracking-wide">
												{game.game_number !== null ? `Game #${game.game_number}` : `ID ${game.id}`}
											</span>
										</div>
										<span className="block font-mono text-[9px] text-fg-muted/60 uppercase tracking-wider">
											{game.participants?.length ?? 0} participants · {relativeTime(game.started_at ?? game.ended_at)}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-4 text-right font-mono shrink-0">
									<div className="hidden sm:block space-y-0.5">
										<span className="block text-[8px] font-bold text-fg-muted uppercase tracking-widest">Started</span>
										<span className="text-[10px] font-bold text-fg-default flex items-center justify-end gap-1">
											<Clock className="size-2.5 text-fg-muted" />{relativeTime(game.started_at)}
										</span>
									</div>
									<div className="w-20">
										<span className="block text-[8px] font-bold text-fg-muted uppercase tracking-widest">Status</span>
										<span className={`font-mono text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${STATUS_BADGE[game.status] ?? ""}`}>
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
							<div className="p-4 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 text-left">
								<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
									<GitCompare className="size-4 text-primary-500" />
									<h3 className="font-mono text-[10px] font-bold text-fg-default uppercase tracking-widest">Match Comparison</h3>
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Secondary Match</label>
									<select value={compareId ?? ""} onChange={(e) => setCompareId(e.target.value)} className="w-full h-8 px-2 bg-bg-canvas/60 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none">
										{processed.map((g) => (
											<option key={g.id} value={g.id}>
												{g.game_number !== null ? `#${g.game_number}` : `ID ${g.id}`} ({g.status})
											</option>
										))}
									</select>
								</div>
								{inspected && compared && (
									<div className="space-y-2 pt-2 border-t border-border-subtle/30 font-mono text-[10px] uppercase">
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
												<span className="font-black text-fg-default truncate">{a}</span>
												<span className="text-fg-muted/40 font-bold text-[8px]">{label}</span>
												<span className="font-black text-fg-default truncate">{b}</span>
											</div>
										))}
									</div>
								)}
							</div>
						) : inspected ? (
							<div className="border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl p-5 space-y-4 shadow-sm text-left">
								<div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
									<div className="flex items-center gap-2">
										<Eye className="size-3.5 text-fg-muted" />
										<h3 className="font-mono text-[10px] font-bold text-fg-muted uppercase tracking-widest">Match Inspector</h3>
									</div>
									<span className={`font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_BADGE[inspected.status] ?? ""}`}>
										{inspected.status}
									</span>
								</div>

								<div className="space-y-3 font-mono">
									<div>
										<h4 className="text-sm font-black tracking-tight text-fg-default uppercase leading-none">
											{inspected.game_number !== null ? `Game #${inspected.game_number}` : `Game ${inspected.id}`}
										</h4>
										<span className="text-[9px] text-fg-muted block mt-1 uppercase tracking-wider">
											ID: {inspected.id}
										</span>
									</div>

									{/* Teams */}
									{(inspected.participants ?? []).length > 0 && (
										<div className="space-y-2 pt-2 border-t border-border-subtle/30">
											<span className="block text-[9px] font-black text-primary-500 uppercase tracking-widest">Balanced Team Formations</span>
											{Object.entries(teamMap(inspected)).map(([team, members], ti) => (
												<div key={team} className="p-2 bg-bg-canvas/40 border border-border-subtle/60 rounded-lg text-left space-y-1">
													<span className={`block text-[8px] font-bold uppercase tracking-wider ${teamColors[ti % teamColors.length]}`}>{team} Team</span>
													<div className="text-[10px] font-bold text-fg-default uppercase truncate">
														{members.map((m) => m.username || m.player_id).join(", ")}
													</div>
													{members.some((m) => m.is_winner) && (
														<span className="font-mono text-[8px] font-bold uppercase text-success bg-success/10 px-1 rounded">Winner</span>
													)}
												</div>
											))}
										</div>
									)}

									{/* Runtime metadata */}
									<div className="pt-2 border-t border-border-subtle/30 space-y-1.5">
										<span className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Runtime Metadata</span>
										<div className="p-2 bg-bg-canvas/20 rounded border border-border-subtle/40 text-[9px] text-fg-muted uppercase space-y-1">
											<div className="flex justify-between"><span>Started:</span><span className="text-fg-default font-bold">{inspected.started_at ? new Date(inspected.started_at).toLocaleString() : "—"}</span></div>
											<div className="flex justify-between"><span>Ended:</span><span className="text-fg-default font-bold">{inspected.ended_at ? new Date(inspected.ended_at).toLocaleString() : "—"}</span></div>
											{inspected.status === "ongoing" && inspected.started_at && (
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
		</div>
	);
}
