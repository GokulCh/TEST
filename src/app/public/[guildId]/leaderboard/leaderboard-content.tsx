"use client";

import { Crown, Search, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import type { PublicPlayer } from "../data";
import { PublicCard, SectionHeading } from "../public-shell";
import { PublicSelect } from "../public-filters";

export default function LeaderboardContent({
	players: livePlayers,
}: {
	players: PublicPlayer[];
}) {
	const [rank, setRank] = useState("ALL RANKS");
	const [sort, setSort] = useState("ELO");
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const players = useMemo(
		() =>
			livePlayers
				.filter(
					(player) =>
						player.name.toLowerCase().includes(query.toLowerCase()) &&
						(rank === "ALL RANKS" || player.rank === rank),
				)
				.sort((a, b) =>
					sort === "WINS"
						? b.wins - a.wins
						: sort === "STREAK"
							? b.streak - a.streak
							: b.elo - a.elo,
				),
		[livePlayers, query, rank, sort],
	);
	const pageCount = Math.max(1, Math.ceil(players.length / 10));
	const activePage = Math.min(page, pageCount);
	const pagePlayers = players.slice((activePage - 1) * 10, activePage * 10);
	const first = pagePlayers[0];
	const second = pagePlayers[1];
	const third = pagePlayers[2];
	const podium = [
		{ player: second, position: 2 },
		{ player: first, position: 1 },
		{ player: third, position: 3 },
	];
	return (
		<main className="mx-auto max-w-[95rem] px-5 py-14 sm:px-8 sm:py-24">
			<SectionHeading
				eyebrow="SEASON 14 RANKINGS"
				title="The climb starts here."
				description="Every win moves the board. Follow the active season and see who is setting the pace."
			/>
			<div className="mx-auto mt-12 grid max-w-5xl items-end gap-4 md:grid-cols-3">
				{podium.map(({ player, position }) =>
					player ? (
						<PublicCard
							key={player.id}
							className={`relative overflow-visible p-5 text-center ${position === 1 ? "order-first border-amber-300/35 bg-amber-300/[0.08] md:order-none md:-translate-y-5" : ""}`}
						>
							<div
								className={`absolute -top-5 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full border-2 text-sm font-black ${position === 1 ? "border-amber-200 bg-amber-300 text-[#071016]" : "border-white/30 bg-white/90 text-[#071016]"}`}
							>
								{position === 1 ? <Crown className="size-4" /> : position}
							</div>
							<img
								src={`https://mc-heads.net/bust/${player.name}`}
								alt={`${player.name} Minecraft avatar`}
								className="mx-auto mt-5 h-20 w-20 rounded-2xl border border-white/15 bg-black/20 object-cover object-top shadow-[0_0_28px_rgba(34,211,238,.14)]"
							/>
							<h2 className="mt-4 text-xl font-black">{player.name}</h2>
							<p className="mt-1 font-mono text-[10px] tracking-widest text-white/40">
								{player.rank}
							</p>
							<p className="mt-4 text-4xl font-black tracking-tight">
								{player.elo.toLocaleString()}{" "}
								<span className="text-xs font-semibold text-white/35">ELO</span>
							</p>
							<div className="mt-4 h-1.5 rounded-full bg-white/10">
								<div
									className="h-full rounded-full bg-cyan-300"
									style={{
										width: `${Math.min(100, (player.elo / 2000) * 100)}%`,
									}}
								/>
							</div>
						</PublicCard>
					) : (
						<div
							key={position}
							className="min-h-56 rounded-xl border border-dashed border-white/10"
						/>
					),
				)}
			</div>
			<div className="mx-auto mt-10 max-w-5xl">
				<div className="mb-5 flex flex-wrap gap-3">
					<label className="relative min-w-56 flex-1">
						<Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />
						<input
							aria-label="Search leaderboard"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search a player..."
							className="w-full rounded-xl border border-white/[0.09] bg-white/[0.025] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-300/40"
						/>
					</label>
					<PublicSelect
						label="RANK"
						value={rank}
						onChange={setRank}
						options={["ALL RANKS", "MASTER", "DIAMOND", "PLATINUM", "GOLD"]}
					/>
					<PublicSelect
						label="SORT"
						value={sort}
						onChange={setSort}
						options={["ELO", "WINS", "STREAK"]}
					/>
				</div>
				<PublicCard className="overflow-hidden">
					<div className="grid grid-cols-[3rem_1fr_5rem_5rem] gap-3 border-b border-white/[0.08] px-5 py-3 font-mono text-[10px] tracking-widest text-white/30">
						<span>#</span>
						<span>PLAYER</span>
						<span>ELO</span>
						<span>FORM</span>
					</div>
					{pagePlayers.map((player, index) => (
						<div
							key={player.id}
							className="grid grid-cols-[3rem_1fr_5rem_5rem] items-center gap-3 border-b border-white/[0.06] px-5 py-4 last:border-0"
						>
							<span className="font-mono text-sm font-bold text-white/35">
								{index + 1}
							</span>
							<div className="flex items-center gap-3">
								<img
									src={`https://mc-heads.net/avatar/${player.name}/32`}
									alt={`${player.name} Minecraft avatar`}
									className="size-9 rounded-lg border border-cyan-300/20 bg-[#111923] object-cover"
								/>
								<div>
									<p className="text-sm font-bold">{player.name}</p>
									<p className="font-mono text-[10px] text-white/35">
										{player.rank}
									</p>
								</div>
							</div>
							<span className="text-sm font-black">{player.elo}</span>
							<span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
								<TrendingUp className="size-3" /> {player.streak}
							</span>
						</div>
					))}
				</PublicCard>
			</div>
		</main>
	);
}
