"use client"

import Link from "next/link"
import { ArrowLeft, GripVertical, Plus, RotateCcw, Search, Sparkles } from "lucide-react"
import { use, useMemo, useState } from "react"
import { publicPlayers } from "../data"
import { PublicCard, SectionHeading } from "../public-shell"

type Tier = { id: string; label: string; color: string; players: string[] }

const initialTiers: Tier[] = [
  { id: "master", label: "MASTER", color: "#f59e0b", players: [] },
  { id: "diamond", label: "DIAMOND", color: "#22d3ee", players: [] },
  { id: "platinum", label: "PLATINUM", color: "#a78bfa", players: [] },
  { id: "gold", label: "GOLD", color: "#facc15", players: [] },
  { id: "open", label: "OPEN", color: "#34d399", players: [] },
]

export default function TierListsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const [tiers, setTiers] = useState(initialTiers)
  const [search, setSearch] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const { guildId } = use(params)
  const assigned = new Set(tiers.flatMap((tier) => tier.players))
  const pool = useMemo(() => publicPlayers.filter((player) => player.name.toLowerCase().includes(search.toLowerCase()) && !assigned.has(player.id)), [assigned, search])

  function placePlayer(tierId: string, playerId: string) {
    setTiers((current) => current.map((tier) => ({ ...tier, players: tier.id === tierId ? [...tier.players, playerId] : tier.players.filter((id) => id !== playerId) })))
    setSelectedPlayer(null)
  }

  function reset() { setTiers(initialTiers); setSelectedPlayer(null) }

  return <div className="mx-auto max-w-[95rem] px-5 py-12 sm:px-8 sm:py-20">
    <Link href={`/public/${guildId}`} className="mb-12 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/55 transition hover:border-cyan-300/30 hover:text-cyan-200"><ArrowLeft className="size-3.5" /> Back to community</Link>
    <div className="mx-auto max-w-4xl text-center"><SectionHeading eyebrow="COMMUNITY TIER LISTS" title="Build the power rankings." description="Arrange the players, compare the climb, and create a community take on who is ready for the next match." /></div>
    <div className="mx-auto max-w-5xl space-y-3">
      {tiers.map((tier) => <div key={tier.id} className="flex min-h-20 overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.025]" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const playerId = event.dataTransfer.getData("playerId"); if (playerId) placePlayer(tier.id, playerId) }}>
        <div className="flex w-32 shrink-0 items-center justify-center px-3 text-center font-mono text-xs font-bold tracking-widest text-[#071016] sm:w-40" style={{ backgroundColor: tier.color }}>{tier.label}</div>
        <div className="flex flex-1 flex-wrap items-center gap-2 p-3" onClick={() => selectedPlayer && placePlayer(tier.id, selectedPlayer)}>
          {tier.players.map((playerId) => { const player = publicPlayers.find((item) => item.id === playerId); return player ? <button key={player.id} type="button" onClick={() => setTiers((current) => current.map((item) => ({ ...item, players: item.players.filter((id) => id !== player.id) })))} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white/80"><span className="grid size-6 place-items-center rounded-md bg-cyan-400/15 font-mono text-[10px] text-cyan-200">{player.avatar}</span>{player.name}</button> : null })}
          {tier.players.length === 0 && <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">Drop players here or select one below</span>}
        </div>
      </div>)}
    </div>
    <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between gap-3"><button type="button" onClick={() => setTiers((current) => [...current, { id: `custom-${current.length}`, label: `TIER ${current.length + 1}`, color: "#64748b", players: [] }])} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs font-semibold text-white/55 hover:border-cyan-300/30 hover:text-cyan-200"><Plus className="size-3.5" /> Add tier</button><button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/45 hover:text-white"><RotateCcw className="size-3.5" /> Reset board</button></div>
    <PublicCard className="mx-auto mt-8 max-w-5xl p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[10px] tracking-[0.2em] text-cyan-300">// PLAYER POOL</p><p className="mt-1 text-sm text-white/45">Drag a player into a tier, or tap a player then tap a row.</p></div><label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"><Search className="size-3.5 text-white/35" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25" /></label></div><div className="mt-5 flex flex-wrap gap-2">{pool.map((player) => <button key={player.id} type="button" draggable onDragStart={(event) => event.dataTransfer.setData("playerId", player.id)} onClick={() => setSelectedPlayer(player.id)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${selectedPlayer === player.id ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white"}`}><GripVertical className="size-3 text-white/25" /><span className="grid size-6 place-items-center rounded-md bg-white/10 font-mono text-[10px]">{player.avatar}</span>{player.name}<span className="font-mono text-[10px] text-white/30">{player.elo}</span></button>)}{pool.length === 0 && <p className="py-5 font-mono text-xs uppercase tracking-widest text-white/30">No unassigned players match.</p>}</div></PublicCard>
    <p className="mx-auto mt-5 flex max-w-5xl items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/30"><Sparkles className="size-3 text-amber-300" /> Your board is a community opinion, not an official rating.</p>
  </div>
}
