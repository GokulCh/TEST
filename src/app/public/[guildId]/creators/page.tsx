import { PublicInfoPage } from "../public-shell"

export default async function CreatorsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  return <PublicInfoPage guildId={guildId} eyebrow="CREATOR PROGRAM" title="The people behind the plays." description="Discover the players, streamers, analysts, and community voices shaping the next season." cards={[{ label: "FEATURED", title: "Find your next watch.", body: "Browse competitive personalities who turn match nights, breakdowns, and ranked climbs into something worth following." }, { label: "SPOTLIGHTS", title: "Stories beyond the scoreboard.", body: "Player spotlights and creator features give the community more ways to understand the people behind the names." }, { label: "COLLABORATE", title: "Build with the network.", body: "Creators can partner on events, season recaps, community challenges, and new ways to make ranked play more visible." }, { label: "APPLY", title: "Bring your voice.", body: "Share your channel or community project with the team and help grow a healthier competitive scene." }]} />
}
