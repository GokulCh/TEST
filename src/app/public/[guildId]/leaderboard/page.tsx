import LeaderboardClient from "./leaderboard-client"
import { getLeaderboardPlayers } from "../player-data"
import { getActiveSeason, getGuildRanks } from "../server-data"

export default async function LeaderboardPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  const [players, season, ranks] = await Promise.all([getLeaderboardPlayers(guildId), getActiveSeason(guildId), getGuildRanks(guildId)])
  return <LeaderboardClient players={players} guildId={guildId} season={season} ranks={ranks} />
}
