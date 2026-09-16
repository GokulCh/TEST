"use client";

import {
	ArrowUpDown,
	Award,
	Calendar,
	Clock,
	Eye,
	Filter,
	GitCompare,
	Loader2,
	RefreshCw,
	Search,
	ShieldCheck,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useGuildConfig } from "@/features/dashboard/config-provider";
import type { PlayerConfigModel, PlayerStatsModel, PlayerStrikeModel } from "@/lib/db-types";

type SortOption = "ELO_HIGH" | "ELO_LOW" | "ALPHA_ASC" | "ALPHA_DESC" | "WIN_STREAK" | "GAMES_PLAYED";

// Enriched roster entry assembled from configs + stats + strikes
interface RosterPlayer {
	configId: string;
	playerId: string;
	username: string;
	nickname: string | null;
	rank: string;
	elo: number;
	highestElo: number;
	gamesPlayed: number;
	wins: number;
	losses: number;
	winStreak: number;
	lossStreak: number;
	activeStrikes: number;
}

function winRate(wins: number, games: number): string {
	if (!games) return "0.0";
	return ((wins / games) * 100).toFixed(1);
}

export default function Page() {
	const { dbGuildId } = useGuildConfig();

	const [players, setPlayers] = useState<RosterPlayer[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [currentSort, setCurrentSort] = useState<SortOption>("ELO_HIGH");
	const [rankFilter, setRankFilter] = useState("ALL");
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
	const [compareMode, setCompareMode] = useState(false);
	const [compareIdx, setCompareIdx] = useState<number | null>(null);

	const load = useCallback(async (isRefresh = false) => {
		if (!dbGuildId) return;
		if (isRefresh) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			// Fetch player configs, stats, and active strikes in parallel
			const [playersRes, strikesRes] = await Promise.all([
				fetch(`/api/db/guilds/${dbGuildId}/players?limit=500`),
				fetch(`/api/db/guilds/${dbGuildId}/strikes?state=active`),
			]);

			const playersData = await playersRes.json();
			const strikesData = await strikesRes.json();

			const configs: PlayerConfigModel[] = playersData.data?.configs ?? [];
			const stats: PlayerStatsModel[] = playersData.data?.stats ?? [];
			const strikes: PlayerStrikeModel[] = strikesData.data ?? [];

			// Build a strike count map keyed by player_id
			const strikeCount: Record<string, number> = {};
			strikes.forEach((s) => {
				strikeCount[String(s.player_id)] = (strikeCount[String(s.player_id)] ?? 0) + 1;
			});

			// Build a stats map keyed by player_id (take latest by highest elo as proxy)
			const statsMap: Record<string, PlayerStatsModel> = {};
			stats.forEach((s) => {
				const key = String(s.player_id);
				const existing = statsMap[key];
				if (!existing || s.elo > existing.elo) statsMap[key] = s;
			});

			// Assemble roster
			const roster: RosterPlayer[] = configs.map((cfg) => {
				const pid = String(cfg.player_id);
				const s = statsMap[pid];
				return {
					configId: String(cfg.id),
					playerId: pid,
					username: cfg.username,
					nickname: cfg.nickname,
					rank: s?.rank ?? "Unranked",
					elo: s?.elo ?? 0,
					highestElo: s?.highest_elo ?? 0,
					gamesPlayed: s?.games_played ?? 0,
					wins: s?.wins ?? 0,
					losses: s?.losses ?? 0,
					winStreak: s?.win_streak ?? 0,
					lossStreak: s?.loss_streak ?? 0,
					activeStrikes: strikeCount[pid] ?? 0,
				};
			});

			setPlayers(roster);
			if (roster.length > 0) setSelectedIdx(0);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load players");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [dbGuildId]);

	useEffect(() => { load(); }, [load]);

	// All unique ranks for the filter dropdown
	const allRanks = [...new Set(players.map((p) => p.rank.toUpperCase()))].sort();

	const processed = players
		.filter((p) => {
			const q = searchQuery.toLowerCase();
			const matchesSearch = !q || p.username.toLowerCase().includes(q) || (p.nickname ?? "").toLowerCase().includes(q) || p.playerId.includes(q);
			const matchesRank = rankFilter === "ALL" || p.rank.toUpperCase() === rankFilter;
			return matchesSearch && matchesRank;
		})
		.sort((a, b) => {
			switch (currentSort) {
				case "ELO_HIGH": return b.elo - a.elo;
				case "ELO_LOW": return a.elo - b.elo;
				case "ALPHA_ASC": return a.username.localeCompare(b.username);
				case "ALPHA_DESC": return b.username.localeCompare(a.username);
				case "WIN_STREAK": return b.winStreak - a.winStreak;
				case "GAMES_PLAYED": return b.gamesPlayed - a.gamesPlayed;
				default: return 0;
			}
		});

	const inspected = selectedIdx !== null ? processed[selectedIdx] ?? null : null;
	const compared = compareIdx !== null ? processed[compareIdx] ?? null : null;

	return (
		<div className="w-full p-6 lg:p-8 space-y-6 animate-in fade-in duration-300 select-none max-w-7xl mx-auto text-left">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
				<div>
					<h1 className="font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted">
						// Player Registry (player_stats / player_config)
					</h1>
					<h2 className="text-2xl font-black tracking-tight text-fg-default mt-1">
						Player Profile Operations Hub
					</h2>
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
						<span>Sync Registry</span>
					</button>
				</div>
			</div>

			{/* Filters */}
			<div className="p-4 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 shadow-sm">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
					<div className="relative lg:col-span-6">
						<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
						<input
							type="text"
							placeholder="Search by username, nickname or player id..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full h-9 pl-9 pr-4 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
						/>
					</div>
					<div className="flex items-center gap-2 lg:col-span-3">
						<ArrowUpDown className="size-3.5 text-fg-muted shrink-0" />
						<select value={currentSort} onChange={(e) => setCurrentSort(e.target.value as SortOption)} className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50">
							<option value="ELO_HIGH">Sort: ELO (High)</option>
							<option value="ELO_LOW">Sort: ELO (Low)</option>
							<option value="ALPHA_ASC">Sort: A–Z</option>
							<option value="ALPHA_DESC">Sort: Z–A</option>
							<option value="WIN_STREAK">Sort: Win Streak</option>
							<option value="GAMES_PLAYED">Sort: Games Played</option>
						</select>
					</div>
					<div className="flex items-center gap-2 lg:col-span-3">
						<Filter className="size-3.5 text-fg-muted shrink-0" />
						<select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)} className="w-full h-9 px-2 bg-bg-canvas/40 border border-border-subtle rounded-lg font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50">
							<option value="ALL">All Ranks</option>
							{allRanks.map((r) => <option key={r} value={r}>{r}</option>)}
						</select>
					</div>
				</div>
			</div>

			{loading && (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="size-6 animate-spin text-primary-500" />
				</div>
			)}

			{error && (
				<div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger font-mono text-xs uppercase">{error}</div>
			)}

			{!loading && !error && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Player list */}
					<div className="lg:col-span-2 space-y-2 max-h-[580px] overflow-y-auto pr-1">
						<div className="px-1 flex justify-between font-mono text-[9px] font-bold text-fg-muted uppercase tracking-widest">
							<span>Registered Players ({processed.length})</span>
							<span>ELO · W/L</span>
						</div>

						{processed.length === 0 && (
							<div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center font-mono text-xs text-fg-muted uppercase tracking-wider">
								No players registered yet.
							</div>
						)}

						{processed.map((player, idx) => (
							<div
								key={player.configId}
								onClick={() => setSelectedIdx(idx)}
								className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group text-left ${selectedIdx === idx ? "bg-primary-500/5 border-primary-500/30 shadow-xs" : "border-border-subtle/50 bg-bg-canvas/10 hover:bg-bg-canvas/30"}`}
							>
								<div className="flex items-center gap-3 min-w-0">
									<div className={`size-9 rounded-lg border flex items-center justify-center shrink-0 shadow-inner ${player.activeStrikes > 0 ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-violet-500/10 border-violet-500/20 text-violet-500"}`}>
										<Users className="size-4" />
									</div>
									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="font-mono text-xs font-black text-fg-default uppercase tracking-wide truncate">{player.username}</span>
											{player.nickname && <span className="font-mono text-[9px] text-primary-400 uppercase">({player.nickname})</span>}
											{player.activeStrikes > 0 && (
												<span className="font-mono text-[8px] font-bold uppercase px-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">{player.activeStrikes}s</span>
											)}
										</div>
										<span className="block font-mono text-[9px] text-fg-muted/60 uppercase tracking-wider truncate">
											{player.rank} · ID {player.playerId}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-4 text-right font-mono shrink-0">
									<div className="hidden sm:block space-y-0.5">
										<span className="block text-[8px] font-bold text-fg-muted uppercase tracking-widest">W / L</span>
										<span className="text-[10px] font-black text-fg-default">{player.wins}<span className="text-fg-muted/50 font-normal"> / </span>{player.losses}</span>
									</div>
									<div className="w-16">
										<span className="block text-[8px] font-bold text-fg-muted uppercase tracking-widest">ELO</span>
										<span className="text-xs font-black text-primary-500 flex items-center justify-end gap-1">
											<Award className="size-3 text-amber-500" />{player.elo}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Right panel: inspector or compare */}
					<div className="space-y-4">
						{compareMode ? (
							<div className="p-4 border border-border-subtle bg-panel-bg/20 backdrop-blur-md rounded-xl space-y-4 text-left">
								<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
									<GitCompare className="size-4 text-primary-500" />
									<h3 className="font-mono text-[10px] font-bold text-fg-default uppercase tracking-widest">Cross-Comparison</h3>
								</div>
								<div className="space-y-1">
									<label className="block font-mono text-[8px] font-bold text-fg-muted uppercase tracking-wider">Secondary Player</label>
									<select
										value={compareIdx ?? ""}
										onChange={(e) => setCompareIdx(Number(e.target.value))}
										className="w-full h-8 px-2 bg-bg-canvas/60 border border-border-subtle rounded-md font-mono text-xs text-fg-default focus:outline-none focus:border-primary-500/50"
									>
										{processed.map((p, i) => (
											<option key={p.configId} value={i}>{p.username} ({p.rank})</option>
										))}
									</select>
								</div>

								{inspected && compared && (
									<div className="space-y-2 pt-2 border-t border-border-subtle/30 font-mono text-[10px] uppercase">
										<div className="grid grid-cols-3 text-center font-bold text-fg-muted text-[8px] tracking-widest border-b border-border-subtle/20 pb-1">
											<span className="truncate">{inspected.username}</span>
											<span className="text-primary-500">METRICS</span>
											<span className="truncate">{compared.username}</span>
										</div>
										{[
											{ label: "ELO", a: inspected.elo, b: compared.elo },
											{ label: "WIN %", a: winRate(inspected.wins, inspected.gamesPlayed), b: winRate(compared.wins, compared.gamesPlayed) },
											{ label: "GAMES", a: inspected.gamesPlayed, b: compared.gamesPlayed },
											{ label: "STREAK", a: `${inspected.winStreak}W`, b: `${compared.winStreak}W` },
											{ label: "STRIKES", a: inspected.activeStrikes, b: compared.activeStrikes },
										].map(({ label, a, b }) => (
											<div key={label} className="grid grid-cols-3 text-center py-1 odd:bg-bg-canvas/20 rounded-sm">
												<span className="font-black text-fg-default">{a}</span>
												<span className="text-fg-muted/40 font-bold text-[8px]">{label}</span>
												<span className="font-black text-fg-default">{b}</span>
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
										<h3 className="font-mono text-[10px] font-bold text-fg-muted uppercase tracking-widest">Player Inspector</h3>
									</div>
									<span className={`font-mono text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${inspected.activeStrikes > 0 ? "text-rose-500 bg-rose-500/10" : "text-success bg-success/10"}`}>
										{inspected.activeStrikes > 0 ? `${inspected.activeStrikes} Strike${inspected.activeStrikes > 1 ? "s" : ""}` : "Clean"}
									</span>
								</div>

								<div className="space-y-3 font-mono">
									<div>
										<h4 className="text-base font-black tracking-tight text-fg-default uppercase leading-none">{inspected.username}</h4>
										<span className="text-[10px] text-fg-muted block mt-1 tracking-wide">
											{inspected.nickname ? `${inspected.nickname} · ` : ""}ID {inspected.playerId}
										</span>
									</div>

									<div className="grid grid-cols-2 gap-2 pt-2">
										<div className="p-2 bg-bg-canvas/40 border border-border-subtle/50 rounded-lg text-left">
											<span className="block text-[8px] font-bold text-fg-muted uppercase tracking-wider">Current ELO</span>
											<span className="text-sm font-black text-primary-500">{inspected.elo}</span>
										</div>
										<div className="p-2 bg-bg-canvas/40 border border-border-subtle/50 rounded-lg text-left">
											<span className="block text-[8px] font-bold text-fg-muted uppercase tracking-wider">Peak ELO</span>
											<span className="text-sm font-black text-fg-default">{inspected.highestElo}</span>
										</div>
									</div>

									<div className="space-y-2 pt-2 border-t border-border-subtle/30">
										<span className="block text-[9px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-1">
											<Calendar className="size-3" /> Seasonal Stats
										</span>
										<div className="p-2 bg-bg-canvas/20 rounded border border-border-subtle/40 text-[10px] text-fg-muted uppercase space-y-1">
											<div className="flex justify-between"><span>Rank:</span><span className="text-fg-default font-bold">{inspected.rank}</span></div>
											<div className="flex justify-between"><span>Games / Wins / Losses:</span><span className="text-fg-default font-bold">{inspected.gamesPlayed} / {inspected.wins} / {inspected.losses}</span></div>
											<div className="flex justify-between"><span>Win Rate:</span><span className="text-success font-bold">{winRate(inspected.wins, inspected.gamesPlayed)}%</span></div>
											<div className="flex justify-between"><span>Win / Loss Streak:</span><span className="text-primary-400 font-bold">{inspected.winStreak}W / {inspected.lossStreak}L</span></div>
										</div>
									</div>

									<div className="space-y-2 pt-1">
										<span className="block text-[9px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-1">
											<Clock className="size-3" /> Disciplinary Feed
										</span>
										{inspected.activeStrikes > 0 ? (
											<div className="p-2 bg-rose-500/5 border border-dashed border-rose-500/20 rounded-md text-[9px] text-rose-400 uppercase tracking-wide">
												{inspected.activeStrikes} active strike row{inspected.activeStrikes > 1 ? "s" : ""} on record
											</div>
										) : (
											<div className="p-3 border border-dashed border-border-subtle/60 rounded-md text-center text-[9px] text-fg-muted uppercase tracking-wide flex items-center justify-center gap-1">
												<ShieldCheck className="size-3.5 text-success" /> Clean Enforcement Ledger
											</div>
										)}
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
