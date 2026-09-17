import { getLivePublicData } from "../server-data"
import LeaderboardContent from "./leaderboard-content"

export default async function LeaderboardPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  const liveData = await getLivePublicData(guildId)
  return <LeaderboardContent players={liveData?.players ?? []} />
}
