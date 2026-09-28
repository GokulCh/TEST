"use client"

import Link from "next/link"
import { ArrowUpRight, Gamepad2, Search, SlidersHorizontal } from "lucide-react"
import { useMemo, useState } from "react"
import type { PublicGame, PublicPlayer, PublicRank } from "./data"
import { PublicCard } from "./public-shell"

export const ALL_RANKS = "ALL RANKS"

/** Filter options: the guild's configured ranks, plus any rank a player holds that is no longer configured (e.g. "UNRANKED"). */
export function rankOptions(ranks: PublicRank[], players: PublicPlayer[]): string[] {
  const names = ranks.map((r) => r.name)
  const known = new Set(names.map((n) => n.toLowerCase()))
  const extra = [...new Set(players.map((p) => p.rank))].filter((r) => r && !known.has(r.toLowerCase()))
  return [ALL_RANKS, ...names, ...extra]
}

const optionLabel = (o: string) => (o === ALL_RANKS ? "All ranks" : o === "ALL MODES" ? "All modes" : o)

export const matchesRank = (selected: string, playerRank: string) => selected === ALL_RANKS || playerRank.toLowerCase() === selected.toLowerCase()

export function PlayerBrowser({ guildId, players, ranks }: { guildId: string; players: PublicPlayer[]; ranks: PublicRank[] }) {
  const [query, setQuery] = useState("")
  const [rank, setRank] = useState(ALL_RANKS)
  const [sort, setSort] = useState("ELO")
  
  const filtered = useMemo(() => 
    players
      .filter((player) => 
        player.name.toLowerCase().includes(query.toLowerCase()) && 
        matchesRank(rank, player.rank)
      )
      .sort((a, b) => 
        sort === "WINS" ? b.wins - a.wins : 
        sort === "STREAK" ? b.streak - a.streak : 
        b.elo - a.elo
      ), 
    [players, query, rank, sort]
  )
  
  return (
    <div>
      <div className="mb-4 grid gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <label className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2">
          <Search className="size-4 shrink-0 text-white/35" />
          <input 
            aria-label="Search players" 
            value={query} 
            onChange={(event) => setQuery(event.target.value)} 
            placeholder="Search players..." 
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" 
          />
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/45">
          <SlidersHorizontal className="size-3.5" />
          <select 
            aria-label="Filter by rank" 
            value={rank} 
            onChange={(event) => setRank(event.target.value)} 
            className="bg-transparent text-cyan-300 outline-none"
          >
            {rankOptions(ranks, players).map((option) => (
              <option key={option} className="bg-[#0b1017]" value={option}>{optionLabel(option)}</option>
            ))}
          </select>
        </label>
        <select 
          aria-label="Sort players" 
          value={sort} 
          onChange={(event) => setSort(event.target.value)} 
          className="rounded-xl border border-white/[0.08] bg-transparent px-3 py-2 text-xs text-cyan-300 outline-none"
        >
          <option className="bg-[#0b1017]" value="ELO">Sort: ELO</option>
          <option className="bg-[#0b1017]" value="WINS">Sort: Wins</option>
          <option className="bg-[#0b1017]" value="STREAK">Sort: Streak</option>
        </select>
      </div>
      <PublicCard className="overflow-hidden">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((player) => (
            <Link 
              key={player.id} 
              href={`/players/${player.slug}`} 
              className="group rounded-xl border border-white/[0.07] bg-black/10 p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-cyan-300/[0.04]"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={`https://mc-heads.net/avatar/${player.name}/44`} 
                  alt={`${player.name} Minecraft avatar`} 
                  className="size-11 rounded-full border border-cyan-300/20 bg-[#111923] object-cover" 
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/35">{player.rank}</p>
                  <p className="mt-0.5 text-sm font-bold text-white truncate">{player.name}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-white/30">ELO</p>
                  <p className="mt-1 text-xs font-bold text-cyan-300">{player.elo}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30">Wins</p>
                  <p className="mt-1 text-xs font-bold text-white">{player.wins}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30">Streak</p>
                  <p className="mt-1 text-xs font-bold text-white">{player.streak}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PublicCard>
    </div>
  )
}

export function GameBrowser({ games }: { games: PublicGame[] }) {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState("ALL MODES")
  const modes = ["ALL MODES", ...Array.from(new Set(games.map((game) => game.mode)))]
  
  const filtered = games.filter((game) => 
    `${game.id} ${game.map} ${game.winner}`.toLowerCase().includes(query.toLowerCase()) && 
    (mode === "ALL MODES" || game.mode === mode)
  )
  
  return (
    <div>
      <div className="mb-4 grid gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <label className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2">
          <Search className="size-4 text-white/35" />
          <input 
            aria-label="Search games" 
            value={query} 
            onChange={(event) => setQuery(event.target.value)} 
            placeholder="Search maps, players, match IDs..." 
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" 
          />
        </label>
        <select 
          aria-label="Filter games by mode" 
          value={mode} 
          onChange={(event) => setMode(event.target.value)} 
          className="rounded-xl border border-white/[0.08] bg-transparent px-3 py-2 text-xs text-cyan-300 outline-none"
        >
          {modes.map((option) => (
            <option key={option} className="bg-[#0b1017]" value={option}>{optionLabel(option)}</option>
          ))}
        </select>
      </div>
      <PublicCard className="overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/[0.08] px-5 py-4 text-xs text-white/35">
          <span>Match</span>
          <span>Result</span>
          <span>When</span>
        </div>
        <div className="divide-y divide-white/[0.07]">
          {filtered.map((game) => (
            <div key={game.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300">
                  <Gamepad2 className="size-4" />
                </span>
                <div>
                  <p className="font-mono text-xs text-white/40">{game.id} · {game.mode}</p>
                  <p className="mt-1 text-sm font-bold">{game.map}</p>
                </div>
              </div>
              <span className="font-mono text-xs text-white/35">{game.winner}</span>
              <span className="font-mono text-xs text-white/35">{game.time}</span>
            </div>
          ))}
        </div>
      </PublicCard>
    </div>
  )
}

export function PublicSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/45">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent text-cyan-300 outline-none">
        {options.map((option) => (
          <option key={option} className="bg-[#0b1017]" value={option}>{optionLabel(option)}</option>
        ))}
      </select>
    </label>
  )
}