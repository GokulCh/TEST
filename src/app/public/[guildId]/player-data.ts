import { dbApi } from "@/lib/api-client"
import { resolvePublicGuildId } from "@/lib/portal-domains"
import type { PublicPlayer } from "./data"
import { slugifyName } from "./data"

export type PublicPlayerAggregates = {
  kills: number
  deaths: number
  bedsBroken: number
  mvps: number
}

async function getPlayerAggregates(guildId: string): Promise<Map<string, PublicPlayerAggregates>> {
  const result = new Map<string, PublicPlayerAggregates>()
  const resolved = await resolvePublicGuildId(guildId)
  try {
    const guild = await dbApi.guilds.getBySnowflake(resolved)
    const lookupIds = [...new Set([String(guild.id), resolved])]

    const gameLists = await Promise.all(
      lookupIds.map(
        (lookupId) =>
          dbApi.games.list(lookupId, 500, 0).catch(() => [] as { id: string | number }[]),
      ),
    )
    const gameIds = [...new Set(gameLists.flat().map((game) => String(game.id)))]

    const participantResults = await Promise.allSettled(
      gameIds.map((gameId) => dbApi.games.getParticipants(gameId)),
    )

    for (const settled of participantResults) {
      if (settled.status !== "fulfilled") continue
      for (const row of settled.value) {
        const playerId = String(row.player_id)
        const entry = result.get(playerId) ?? { kills: 0, deaths: 0, bedsBroken: 0, mvps: 0 }
        entry.kills += row.kills
        entry.deaths += row.deaths
        entry.bedsBroken += row.beds_destroyed
        entry.mvps += row.is_mvp ? 1 : 0
        result.set(playerId, entry)
      }
    }
  } catch (error) {
    console.error("[public player aggregates]", error)
  }
  return result
}

export async function getGuildPlayers(guildId: string): Promise<PublicPlayer[]> {
  const resolved = await resolvePublicGuildId(guildId)
  try {
    const guild = await dbApi.guilds.getBySnowflake(resolved)
    const lookupIds = [...new Set([String(guild.id), resolved])]
    
    const results = await Promise.all(lookupIds.map(async (lookupId) => Promise.allSettled([
      dbApi.players.listConfigByGuild(lookupId, 500),
      dbApi.players.listStatsByGuild(lookupId, 500),
    ])))
    
    const configs = results.flatMap((result) => result[0].status === "fulfilled" ? result[0].value : [])
    const stats = results.flatMap((result) => result[1].status === "fulfilled" ? result[1].value : [])
    
    const statsByPlayer = new Map(stats.map((stat) => [stat.player_id, stat]))
    return configs
      .map((config) => {
        const stat = statsByPlayer.get(config.player_id)
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
  } catch (error) {
    console.error("[public guild players]", error)
    return []
  }
}

export async function getLeaderboardPlayers(guildId: string): Promise<PublicPlayer[]> {
  const [players, aggregates] = await Promise.all([
    getGuildPlayers(guildId),
    getPlayerAggregates(guildId),
  ])
  return players.map((player) => {
    const stats = aggregates.get(player.id)
    return {
      ...player,
      kills: stats?.kills ?? 0,
      deaths: stats?.deaths ?? 0,
      bedsBroken: stats?.bedsBroken ?? 0,
      mvps: stats?.mvps ?? 0,
    }
  })
}

export function getPlayerStats(players: PublicPlayer[]) {
  return players.reduce((total, player) => total + player.games, 0)
}
export function getPlayerWins(players: PublicPlayer[]) {
  return players.reduce((total, player) => total + player.wins, 0)
}
export function getPlayerCount(players: PublicPlayer[]) {
  return players.length
}
