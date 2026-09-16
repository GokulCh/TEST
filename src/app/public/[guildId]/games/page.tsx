import { SectionHeading } from "../public-shell"
import { publicGames } from "../data"
import { GameBrowser } from "../public-filters"

export default async function GamesPage({ params }: { params: Promise<{ guildId: string }> }) { await params; return <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"><SectionHeading eyebrow="MATCH HISTORY" title="Games worth replaying." description="A live feed of the latest matches across every queue and map." /><GameBrowser games={publicGames} /></div> }
