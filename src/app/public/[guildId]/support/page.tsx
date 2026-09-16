import { PublicInfoPage } from "../public-shell"

export default async function SupportPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  return <PublicInfoPage guildId={guildId} eyebrow="SUPPORT CENTER" title="Need a hand? Start here." description="Find the right path for account questions, match issues, community guidance, and everything around the climb." cards={[{ label: "ACCOUNT", title: "Profiles and registration.", body: "Get help linking your player identity, finding your profile, or understanding what appears on the public leaderboard." }, { label: "MATCHES", title: "Results and disputes.", body: "If a game result looks wrong or a queue issue needs attention, collect the match details and send them to the team." }, { label: "COMMUNITY", title: "Ask where players are.", body: "Join the community channels for quick answers, queue coordination, event updates, and network announcements." }, { label: "STATUS", title: "See what is live.", body: "Season status, recent games, and current rankings are always available through the public portal." }]} />
}
