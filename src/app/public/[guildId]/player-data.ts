import { dbApi } from "@/lib/server/api-client"
import { BoundedCache } from "@/lib/server/bounded-cache"
import { resolvePublicGuildId } from "@/lib/server/portal-domains"
import type { PublicPlayer } from "./data"
import { slugifyName } from "./data"

type Aggregates = Map<string, { kills: number; deaths: number; bedsBroken: number; mvps: number }>

// One load per guild every two minutes, however many pages render meanwhile.
const players = new BoundedCache<PublicPlayer[]>(50, 2 * 60_000)
const aggregates = new BoundedCache<Aggregates>(50, 2 * 60_000)

/** Recent games are enough for a leaderboard and keep the per-game calls bounded. */
const AGGREGATE_GAMES = 50
const BATCH = 5

async function loadPlayers(guildId: string): Promise<PublicPlayer[]> {
  const id = await resolvePublicGuildId(guildId)
  const [configs, stats] = await Promise.all([dbApi.players.listAllConfigByGuild(id), dbApi.players.listAllStatsByGuild(id)])
  const statOf = new Map(stats.map((s) => [s.player_id, s]))
  return configs.map((config) => {
    const stat = statOf.get(config.player_id)
    const name = config.nickname?.trim() || config.username
    return {
      id: config.player_id,
      name,
      slug: slugifyName(name),
      rank: stat?.rank || "UNRANKED",
      elo: stat?.elo || 0,
      wins: stat?.wins || 0,
      games: stat?.games_played || 0,
      streak: stat?.win_streak || 0,
      kills: 0,
      deaths: 0,
      bedsBroken: 0,
      mvps: 0,
      avatar: name.charAt(0).toUpperCase(),
    }
  })
}

async function loadAggregates(guildId: string): Promise<Aggregates> {
  const id = await resolvePublicGuildId(guildId)
  const games = await dbApi.games.list(id, AGGREGATE_GAMES, 0, "completed")
  const result: Aggregates = new Map()
  for (let i = 0; i < games.length; i += BATCH) {
    const batch = await Promise.all(games.slice(i, i + BATCH).map((g) => dbApi.games.getParticipants(id, g.id).catch(() => [])))
    for (const row of batch.flat()) {
      const key = String(row.player_id)
      const entry = result.get(key) ?? { kills: 0, deaths: 0, bedsBroken: 0, mvps: 0 }
      entry.kills += row.kills
      entry.deaths += row.deaths
      entry.bedsBroken += row.beds_destroyed
      entry.mvps += row.is_mvp ? 1 : 0
      result.set(key, entry)
    }
  }
  return result
}

/** Failures are logged and give an empty result that is not cached. */
async function safely<T>(what: string, load: Promise<T>, empty: T): Promise<T> {
  try {
    return await load
  } catch (error) {
    console.error(`[public ${what}]`, error)
    return empty
  }
}

export const getGuildPlayers = (guildId: string) => safely("players", players.remember(guildId, () => loadPlayers(guildId)), [])

export async function getLeaderboardPlayers(guildId: string): Promise<PublicPlayer[]> {
  const [list, stats] = await Promise.all([
    getGuildPlayers(guildId),
    safely("player aggregates", aggregates.remember(guildId, () => loadAggregates(guildId)), new Map() as Aggregates),
  ])
  return list.map((player) => ({ ...player, ...stats.get(String(player.id)) }))
}
