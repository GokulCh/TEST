"use client";

import { ArrowUpDown, Award, Calendar, Clock, Eye, Filter, GitCompare, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/panel/form-parts";
import { CompareToggle, LoadingBlock, RefreshButton } from "@/components/panel/data-table";
import { useGuildData } from "@/hooks/use-guild-data";
import OptionDropdown from "@/components/ui/OptionDropdown";
import type { PlayerConfigModel, PlayerStatsModel, PlayerStrikeModel } from "@/lib/db-types";

import { PageShell } from "@/components/panel/page-shell";
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
	const [searchQuery, setSearchQuery] = useState("");
	const [currentSort, setCurrentSort] = useState<SortOption>("ELO_HIGH");
	const [rankFilter, setRankFilter] = useState("ALL");
	const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
	const [compareMode, setCompareMode] = useState(false);
	const [compareIdx, setCompareIdx] = useState<number | null>(null);
	const [debouncedSearch, setDebouncedSearch] = useState("");

	// Debounce search to reduce API calls
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchQuery);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// The server filters and pages; strikes are counted per player from the active ones.
	const query = new URLSearchParams({ limit: "50", offset: "0" });
	if (debouncedSearch) query.set("search", debouncedSearch);
	if (rankFilter !== "ALL") query.set("rank", rankFilter);
	const playersRes = useGuildData<{ configs: PlayerConfigModel[]; stats: PlayerStatsModel[] }>(`players?${query}`, { keepPreviousData: true });
	const strikesRes = useGuildData<PlayerStrikeModel[]>("strikes?state=active");
	const loading = playersRes.isLoading || strikesRes.isLoading;
	const refreshing = (playersRes.isValidating || strikesRes.isValidating) && !loading;
	const error = (playersRes.error ?? strikesRes.error)?.message ?? null;
	const refresh = () => { void playersRes.mutate(); void strikesRes.mutate(); };

	const players = useMemo<RosterPlayer[]>(() => {
		const configs = playersRes.data?.configs ?? [];
		const strikeCount: Record<string, number> = {};
		for (const s of strikesRes.data ?? []) strikeCount[String(s.player_id)] = (strikeCount[String(s.player_id)] ?? 0) + 1;
		// One stats row per player (the one with the highest elo, as a proxy for the latest).
		const statsMap: Record<string, PlayerStatsModel> = {};
		for (const s of playersRes.data?.stats ?? []) {
			const existing = statsMap[String(s.player_id)];
			if (!existing || s.elo > existing.elo) statsMap[String(s.player_id)] = s;
		}
		return configs.map((cfg) => {
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
	}, [playersRes.data, strikesRes.data]);

	// A new result set starts at its first row.
	useEffect(() => { setSelectedIdx(players.length > 0 ? 0 : null); }, [players]);

	// All unique ranks for the filter dropdown
	const allRanks = [...new Set(players.map((p) => p.rank.toUpperCase()))].sort();

	const processed = [...players]
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
		<PageShell eyebrow="Players" title="Player Management" actions={<><CompareToggle active={compareMode} onToggle={() => setCompareMode(!compareMode)} /><RefreshButton onClick={refresh} refreshing={refreshing} /></>}>

			{/* Filters */}
			<div className="p-4 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 shadow-sm">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
					<div className="relative lg:col-span-6">
						<Search className="absolute left-3 top-2.5 size-4 text-fg-muted/60" />
						<input
							type="text"
							placeholder="Search by username, nickname or player id..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full h-9 pl-9 pr-4 bg-bg-canvas/40 border border-border-subtle rounded-lg text-sm text-fg-default transition-[border-color,box-shadow] duration-150 hover:border-fg-muted/30 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/15"
						/>
					</div>
						<div className="flex items-center gap-2 lg:col-span-3">
							<ArrowUpDown className="size-3.5 shrink-0 text-fg-muted" />
							<OptionDropdown
								value={currentSort}
								onChange={(value) => setCurrentSort(value as SortOption)}
								ariaLabel="Sort players"
								className="min-w-0 flex-1"
								options={[
									{ value: "ELO_HIGH", label: "Sort: ELO (High)" },
									{ value: "ELO_LOW", label: "Sort: ELO (Low)" },
									{ value: "ALPHA_ASC", label: "Sort: A–Z" },
									{ value: "ALPHA_DESC", label: "Sort: Z–A" },
									{ value: "WIN_STREAK", label: "Sort: Win Streak" },
									{ value: "GAMES_PLAYED", label: "Sort: Games Played" },
								]}
							/>
						</div>
						<div className="flex items-center gap-2 lg:col-span-3">
							<Filter className="size-3.5 shrink-0 text-fg-muted" />
							<OptionDropdown
								value={rankFilter}
								onChange={setRankFilter}
								ariaLabel="Filter by rank"
								className="min-w-0 flex-1"
								options={[{ value: "ALL", label: "All Ranks" }, ...allRanks.map((rank) => ({ value: rank, label: rank }))]}
							/>
						</div>
				</div>
			</div>

			{loading && (
				<div className="flex items-center justify-center py-16">
					<Spinner className="size-6 text-primary-500" />
				</div>
			)}

			{error && (
				<div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-xs">{error}</div>
			)}

				{!loading && !error && processed.length === 0 && (
					<div className="p-8 border border-dashed border-border-subtle/40 rounded-xl text-center text-xs text-fg-muted">
						No players registered yet.
					</div>
				)}

				{!loading && !error && processed.length > 0 && (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Player list */}
					<div className="lg:col-span-2 space-y-2 max-h-[580px] overflow-y-auto pr-1">
						<div className="px-1 flex justify-between text-xs font-medium text-fg-muted">
							<span>Registered Players ({processed.length})</span>
							<span>ELO · W/L</span>
						</div>


						{processed.map((player, idx) => (
							<div
								key={player.configId}
								onClick={() => setSelectedIdx(idx)}
								className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group text-left ${selectedIdx === idx ? "bg-primary-500/5 border-primary-500/30 shadow-xs" : "border-border-subtle/50 bg-bg-canvas/10 hover:bg-bg-canvas/30"}`}
							>
								<div className="flex items-center gap-3 min-w-0">
									<img
										src={`https://mc-heads.net/avatar/${player.username}/32`}
										alt={player.username}
										width={36}
										height={36}
										className="size-9 rounded-lg shrink-0 shadow-inner"
									/>
									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<span className="text-[13px] font-semibold text-fg-default truncate">{player.username}</span>
											{player.nickname && <span className="text-xs text-primary-400">({player.nickname})</span>}
											{player.activeStrikes > 0 && (
												<span className="text-xs font-medium px-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 capitalize">{player.activeStrikes}s</span>
											)}
										</div>
										<span className="block text-xs text-fg-muted/60 truncate">
											{player.rank} · ID {player.playerId}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-4 font-mono shrink-0">
									<div className="hidden sm:block text-center space-y-0.5 w-14">
										<span className="block text-xs font-medium text-fg-muted">W / L</span>
										<span className="flex items-center justify-center gap-1 text-[10px] font-semibold text-fg-default">{player.wins}<span className="text-fg-muted/50 font-normal"> / </span>{player.losses}</span>
									</div>
									<div className="text-center space-y-0.5 w-16">
										<span className="block text-xs font-medium text-fg-muted">ELO</span>
										<span className="flex items-center justify-center gap-1 text-xs font-semibold text-primary-500">
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
							<div className="p-4 rounded-xl border border-border-subtle bg-panel-bg/40 space-y-4 text-left">
								<div className="flex items-center gap-2 border-b border-border-subtle/50 pb-2">
									<GitCompare className="size-4 text-primary-500" />
									<h3 className="text-[13px] font-semibold text-fg-default">Cross-Comparison</h3>
								</div>
								<div className="space-y-1">
									<label className="block text-xs font-medium text-fg-muted">Secondary Player</label>
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
									<div className="space-y-2 pt-2 border-t border-border-subtle/30 text-xs">
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
												<span className="font-semibold text-fg-default">{a}</span>
												<span className="text-fg-muted/40 font-bold text-[8px]">{label}</span>
												<span className="font-semibold text-fg-default">{b}</span>
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
										<h3 className="text-xs font-medium text-fg-muted">Player Inspector</h3>
									</div>
									<span className={`text-xs font-medium px-1.5 py-0.5 rounded ${inspected.activeStrikes > 0 ? "text-rose-500 bg-rose-500/10" : "text-success bg-success/10"}`}>
										{inspected.activeStrikes > 0 ? `${inspected.activeStrikes} Strike${inspected.activeStrikes > 1 ? "s" : ""}` : "Clean"}
									</span>
								</div>

								<div className="space-y-3 font-mono">
									<div>
										<h4 className="text-base font-semibold text-fg-default leading-none">{inspected.username}</h4>
										<span className="text-[10px] text-fg-muted block mt-1 tracking-wide">
											{inspected.nickname ? `${inspected.nickname} · ` : ""}ID {inspected.playerId}
										</span>
									</div>

									<div className="grid grid-cols-2 gap-2 pt-2">
										<div className="p-2 bg-bg-canvas/40 border border-border-subtle/50 rounded-lg text-left">
											<span className="block text-xs font-medium text-fg-muted">Current ELO</span>
											<span className="text-sm font-semibold text-primary-500">{inspected.elo}</span>
										</div>
										<div className="p-2 bg-bg-canvas/40 border border-border-subtle/50 rounded-lg text-left">
											<span className="block text-xs font-medium text-fg-muted">Peak ELO</span>
											<span className="text-sm font-semibold text-fg-default">{inspected.highestElo}</span>
										</div>
									</div>

									<div className="space-y-2 pt-2 border-t border-border-subtle/30">
										<span className="block text-xs font-medium text-primary-500 flex items-center gap-1">
											<Calendar className="size-3" /> Seasonal Stats
										</span>
										<div className="p-2 bg-bg-canvas/20 rounded border border-border-subtle/40 text-xs text-fg-muted space-y-1">
											<div className="flex justify-between"><span>Rank:</span><span className="text-fg-default font-bold">{inspected.rank}</span></div>
											<div className="flex justify-between"><span>Games / Wins / Losses:</span><span className="text-fg-default font-bold">{inspected.gamesPlayed} / {inspected.wins} / {inspected.losses}</span></div>
											<div className="flex justify-between"><span>Win Rate:</span><span className="text-success font-bold">{winRate(inspected.wins, inspected.gamesPlayed)}%</span></div>
											<div className="flex justify-between"><span>Win / Loss Streak:</span><span className="text-primary-400 font-bold">{inspected.winStreak}W / {inspected.lossStreak}L</span></div>
										</div>
									</div>

									<div className="space-y-2 pt-1">
										<span className="block text-xs font-medium text-primary-500 flex items-center gap-1">
											<Clock className="size-3" /> Disciplinary Feed
										</span>
										{inspected.activeStrikes > 0 ? (
											<div className="p-2 bg-rose-500/5 border border-dashed border-rose-500/20 rounded-md text-xs text-rose-400">
												{inspected.activeStrikes} active strike row{inspected.activeStrikes > 1 ? "s" : ""} on record
											</div>
										) : (
											<div className="p-3 border border-dashed border-border-subtle/60 rounded-md text-center text-xs text-fg-muted flex items-center justify-center gap-1">
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
		</PageShell>
	);
}