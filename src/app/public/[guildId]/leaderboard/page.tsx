import LeaderboardClient from "./leaderboard-client"
import { getLeaderboardPlayers } from "../player-data"

export default async function LeaderboardPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  const players = await getLeaderboardPlayers(guildId)
  return <LeaderboardClient players={players} guildId={guildId} />
}
