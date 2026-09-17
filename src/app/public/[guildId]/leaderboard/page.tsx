import LeaderboardClient from "./leaderboard-client"
import { getGuildPlayers } from "../player-data"

export default async function LeaderboardPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  const players = await getGuildPlayers(guildId)
  return <LeaderboardClient players={players} guildId={guildId} />
}
