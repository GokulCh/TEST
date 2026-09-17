import { dbApi } from "@/lib/api-client"
import type { PublicPlayer } from "./data"
import { slugifyName } from "./data"

export async function getGuildPlayers(guildId: string): Promise<PublicPlayer[]> {
  try {
    const guild = await dbApi.guilds.getBySnowflake(guildId)
    const lookupIds = [...new Set([String(guild.id), guildId])]
    
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
          avatar: name.charAt(0).toUpperCase(),
        }
      })
  } catch (error) {
    console.error("[public guild players]", error)
    return []
  }
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
