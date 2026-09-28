import { PublicSection, SectionHeading } from "../public-shell"
import { getGuildPlayers } from "../player-data"
import { getGuildRanks } from "../server-data"
import { PlayerBrowser } from "../public-filters"

export default async function PlayersPage({ params }: { params: Promise<{ guildId: string }> }) { const { guildId } = await params; const [players, ranks] = await Promise.all([getGuildPlayers(guildId), getGuildRanks(guildId)]); return <PublicSection><SectionHeading eyebrow="Player index" title="Meet the competitors." description="Every match adds to the story. Explore the players climbing the current season." /><PlayerBrowser guildId={guildId} players={players} ranks={ranks} /></PublicSection> }
