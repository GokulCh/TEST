import { PublicInfoPage } from "../public-shell"

export default async function PartnersPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params
  return <PublicInfoPage guildId={guildId} eyebrow="COMMUNITY PARTNERS" title="Better competition is a team effort." description="Meet the organizations, teams, and builders helping the network create more opportunities to play." cards={[{ label: "ORGANIZATIONS", title: "Built for communities.", body: "Partner spaces can bring their players, events, and competitive identity into one shared season experience." }, { label: "EVENTS", title: "More reasons to queue.", body: "From community cups to seasonal challenges, partners help turn rankings into moments the whole network can rally around." }, { label: "TOOLS", title: "Useful by default.", body: "Shared data, public profiles, and readable match history make it easier to build tools that serve real competitors." }, { label: "PARTNER", title: "Add your banner to the climb.", body: "Tell us what you are building and where your community wants to go next." }]} />
}
