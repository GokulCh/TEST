import { PublicInfoPage } from "../public-shell"

export default async function AboutPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  return <PublicInfoPage guildId={guildId} eyebrow="About the network" title="Competitive play, clearly presented." description="A public home for fair matchmaking, transparent stats, and a community that wants every game to mean something." cards={[{ label: "Mission", title: "Make the climb feel earned.", body: "We bring queues, results, rankings, and player history into one readable competitive experience so progress is easy to understand." }, { label: "Format", title: "Built around real competition.", body: "Season-based ELO, match history, player profiles, and community tools give competitors the context they need before and after every game." }, { label: "Values", title: "Fairness over noise.", body: "Clear rules, visible outcomes, and a focus on the players keep the network useful for competitors at every level." }, { label: "Seasons", title: "A living competitive board.", body: "Each season creates a fresh reason to play, improve, and see how your name stacks up against the network." }]} />
}
