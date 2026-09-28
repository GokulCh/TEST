import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Flame, Swords, Trophy } from "@/components/shared/icons"
import type { ComponentType } from "react"
import { PublicCard, PublicSection } from "../../public-shell"
import { getGuildPlayers } from "../../player-data"
import { getActiveSeason } from "../../server-data"

export default async function PlayerPage({ params }: { params: Promise<{ guildId: string; playerId: string }> }) {
  const { guildId, playerId } = await params
  const [players, season] = await Promise.all([getGuildPlayers(guildId), getActiveSeason(guildId)])
  const player = players.find((entry) => entry.slug === playerId)

  if (!player) notFound()

  const stats: Array<[string, string | number, ComponentType<{ className?: string }>]> = [
    ["ELO", player.elo, Trophy],
    ["Wins", player.wins, Swords],
    ["Games", player.games, Swords],
    ["Streak", `${player.streak}W`, Flame],
  ]

  return <PublicSection>
    <Link href="/players" className="mb-10 inline-flex items-center gap-2 text-xs font-bold text-white/45 transition-colors hover:text-cyan-300"><ArrowLeft className="size-3.5" /> Back to players</Link>
    <PublicCard className="overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-cyan-400/25 via-violet-400/15 to-transparent" />
      <div className="-mt-12 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <img src={`https://mc-heads.net/avatar/${player.name}/96`} alt={`${player.name} Minecraft avatar`} className="size-24 rounded-2xl border-4 border-[#070a0f] bg-[#111923] object-cover shadow-[0_0_28px_rgba(34,211,238,.14)]" />
          <div><p className="text-xs text-cyan-300">Player profile</p><h1 className="mt-2 text-4xl font-bold">{player.name}</h1><p className="mt-1 text-sm text-white/45">{player.rank} division · {season}</p></div>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-4">{stats.map(([label, value, Icon]) => <div key={label} className="rounded-xl bg-black/20 p-4"><Icon className="size-4 text-cyan-300" /><p className="mt-4 text-xs text-white/35">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</div>
      </div>
    </PublicCard>
  </PublicSection>
}
