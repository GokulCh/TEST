import { ApiError, dbApi } from "@/lib/server/api-client"
import { BoundedCache } from "@/lib/server/bounded-cache"
import { resolvePublicGuildId } from "@/lib/server/portal-domains"
import type { PublicGame, PublicRank } from "./data"
import { guildDisplayName } from "./data"

/**
 * Public pages are anonymous and hot, so every read is cached for a short while
 * and concurrent renders share one load. The Database API takes the snowflake
 * as the guild id, so nothing here looks the guild up first.
 */
const cache = new BoundedCache<unknown>(500, 30_000)

/** `load` for the portal's guild, cached per `name`. A failure is logged, not cached, and gives `fallback`. */
async function cached<T>(name: string, guildId: string, load: (id: string) => Promise<T>, fallback: T): Promise<T> {
  try {
    return (await cache.remember(`${name}:${guildId}`, async () => load(await resolvePublicGuildId(guildId)))) as T
  } catch (error) {
    console.error(`[public ${name}]`, error)
    return fallback
  }
}

export const getPublicGuildInfo = (guildId: string) =>
  cached<{ exists: boolean; name: string }>(
    "guild info",
    guildId,
    async (id) => {
      // The demo guild is a self-contained preview that isn't registered in the DB.
      if (id === "demo") return { exists: true, name: guildDisplayName("demo") }
      try {
        const guild = await dbApi.guilds.getBySnowflake(id)
        return { exists: true, name: guild.name?.trim() || guildDisplayName(id) }
      } catch (error) {
        if (error instanceof ApiError && error.isNotFound) return { exists: false, name: guildDisplayName(id) }
        throw error
      }
    },
    { exists: false, name: guildDisplayName(guildId) },
  )

export async function getPublicGuildName(guildId: string): Promise<string> {
  return (await getPublicGuildInfo(guildId)).name
}

export const getPublicStats = (guildId: string) =>
  cached(
    "stats",
    guildId,
    async (id) => {
      const [active, total, players] = await Promise.allSettled([
        dbApi.games.listActive(id),
        dbApi.games.countTotal(id),
        dbApi.players.count(id),
      ])
      return {
        activeGames: active.status === "fulfilled" ? active.value.length : 0,
        totalGames: total.status === "fulfilled" ? total.value.count : 0,
        registeredPlayers: players.status === "fulfilled" ? players.value.count : 0,
      }
    },
    { activeGames: 0, totalGames: 0, registeredPlayers: 0 },
  )

/** The ranks the guild configured (highest first), so filters and badges follow the guild's own ladder. */
export const getGuildRanks = (guildId: string) =>
  cached<PublicRank[]>(
    "ranks",
    guildId,
    async (id) => {
      const meta = await dbApi.gameConfig.get(id)
      return [...(meta.ranks ?? [])].sort((a, b) => b.min_elo - a.min_elo).map((r) => ({ name: r.rank_name, color: r.color }))
    },
    [],
  )

const RECENT_GAMES = 20
const PARTICIPANT_BATCH = 5

export const getPublicGames = (guildId: string) =>
  cached<PublicGame[]>(
    "games",
    guildId,
    async (id) => {
      const games = await dbApi.games.list(id, RECENT_GAMES, 0)
      // The winning team comes from the game's participants; a failed lookup leaves the result blank, not wrong.
      const winners = new Map<string, string>()
      for (let i = 0; i < games.length; i += PARTICIPANT_BATCH) {
        await Promise.all(
          games.slice(i, i + PARTICIPANT_BATCH).map(async (game) => {
            if (game.status !== "completed") return
            const rows = await dbApi.games.getParticipants(id, game.id).catch(() => [])
            const team = rows.find((r) => r.is_winner)?.team
            if (team) winners.set(String(game.id), team)
          }),
        )
      }
      return games.map((game) => ({
        id: String(game.id),
        mode: String(game.mode_name),
        map: String(game.map_name),
        winner: winners.get(String(game.id)) ? `${winners.get(String(game.id))} won` : game.status,
        score: game.status,
        time: game.ended_at ? new Date(game.ended_at).toLocaleString() : "In progress",
      }))
    },
    [],
  )

/** Name of the season the API marks active, else the most recently started one. */
export const getActiveSeason = (guildId: string) =>
  cached(
    "active season",
    guildId,
    async (id) => {
      const seasons = await dbApi.seasons.list(id)
      const season = seasons.find((s) => s.is_active) ?? [...seasons].sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0]
      return season?.name || "N/A"
    },
    "N/A",
  )
