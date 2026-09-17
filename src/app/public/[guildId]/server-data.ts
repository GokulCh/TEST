import { dbApi } from "@/lib/api-client"
import type { PublicGame, PublicPlayer } from "./data"
import { slugifyName } from "./data"

export async function getLivePublicData(guildId: string) {
  try {
    const guild = await dbApi.guilds.getBySnowflake(guildId)
    const lookupIds = [...new Set([String(guild.id), guildId])]
    const results = await Promise.all(lookupIds.map(async (lookupId) => Promise.allSettled([
      dbApi.players.listConfigByGuild(lookupId),
      dbApi.players.listStatsByGuild(lookupId),
      dbApi.games.list(lookupId),
    ])))
    const configs = results.flatMap((result) => result[0].status === "fulfilled" ? result[0].value : [])
    const stats = results.flatMap((result) => result[1].status === "fulfilled" ? result[1].value : [])
    const games = results.flatMap((result) => result[2].status === "fulfilled" ? result[2].value : [])
    const configByPlayer = new Map(configs.map((config) => [config.player_id, config]))
    const statsByPlayer = new Map(stats.map((stat) => [stat.player_id, stat]))
    const players: PublicPlayer[] = configs
      .map((config) => {
        const stat = statsByPlayer.get(config.player_id)
        const name = config.username ?? `Player ${config.player_id}`
        return {
          id: config.player_id,
          name,
          slug: slugifyName(name),
          rank: stat?.rank ?? "UNRANKED",
          elo: stat?.elo ?? 0,
          wins: stat?.wins ?? 0,
          games: stat?.games_played ?? 0,
          streak: stat?.win_streak ?? 0,
          avatar: name.charAt(0).toUpperCase(),
          avatarUrl: `https://nmsr.nickac.dev/face/${encodeURIComponent(name)}`,
        }
      })
      .sort((a, b) => b.elo - a.elo)
    const publicGames: PublicGame[] = games.map((game) => ({ id: String(game.id), mode: String(game.mode_id), map: String(game.map_id), winner: "—", score: game.status, time: game.ended_at ? new Date(game.ended_at).toLocaleString() : "In progress" }))
    return { guild, players, games: publicGames }
  } catch {
    return null
  }
}

export async function getPublicStats(guildId: string) {
  try {
    const guild = await dbApi.guilds.getBySnowflake(guildId)
    const lookupIds = [...new Set([String(guild.id), guildId])]
    
    const results = await Promise.all(lookupIds.map(async (lookupId) => Promise.allSettled([
      dbApi.games.listActive(lookupId),
      dbApi.games.countTotal(lookupId),
      dbApi.players.listConfigByGuild(lookupId),
    ])))
    
    const activeGames = results.flatMap((result) => result[0].status === "fulfilled" ? result[0].value : [])
    const totalGames = results.flatMap((result) => result[1].status === "fulfilled" ? result[1].value : [])
    const players = results.flatMap((result) => result[2].status === "fulfilled" ? result[2].value : [])

    return {
      activeGames: activeGames.length,
      totalGames: totalGames.length > 0 ? totalGames[0].count : 0,
      registeredPlayers: players.length,
    }
  } catch (error) {
    console.error("[public stats]", error)
    return {
      activeGames: 0,
      totalGames: 0,
      registeredPlayers: 0,
    }
  }
}

export async function getPublicGames(guildId: string): Promise<PublicGame[]> {
  try {
    const guild = await dbApi.guilds.getBySnowflake(guildId)
    const lookupIds = [...new Set([String(guild.id), guildId])]
    
    const results = await Promise.all(lookupIds.map(async (lookupId) => 
      Promise.allSettled([dbApi.games.list(lookupId, 20, 0)])
    ))
    
    const games = results.flatMap((result) => result[0].status === "fulfilled" ? result[0].value : [])
    
    return games.map((game) => ({
      id: String(game.id),
      mode: String(game.mode_id),
      map: String(game.map_id),
      winner: "—",
      score: game.status,
      time: game.ended_at ? new Date(game.ended_at).toLocaleString() : "In progress",
    }))
  } catch (error) {
    console.error("[public games]", error)
    return []
  }
}
