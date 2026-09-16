import { SectionHeading } from "../public-shell"
import { publicPlayers } from "../data"
import { PlayerBrowser } from "../public-filters"

export default async function PlayersPage({ params }: { params: Promise<{ guildId: string }> }) { const { guildId } = await params; return <div className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24"><SectionHeading eyebrow="PLAYER INDEX" title="Meet the competitors." description="Every match adds to the story. Explore the players climbing through Season 14." /><PlayerBrowser guildId={guildId} players={publicPlayers} /></div> }
