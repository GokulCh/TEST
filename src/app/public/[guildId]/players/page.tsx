import { SectionHeading } from "../public-shell"
import { getGuildPlayers } from "../player-data"
import { getGuildRanks } from "../server-data"
import { PlayerBrowser } from "../public-filters"

export default async function PlayersPage({ params }: { params: Promise<{ guildId: string }> }) { const { guildId } = await params; const [players, ranks] = await Promise.all([getGuildPlayers(guildId), getGuildRanks(guildId)]); return <div className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24"><SectionHeading eyebrow="Player index" title="Meet the competitors." description="Every match adds to the story. Explore the players climbing the current season." /><PlayerBrowser guildId={guildId} players={players} ranks={ranks} /></div> }
