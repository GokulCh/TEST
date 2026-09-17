import { SectionHeading } from "../public-shell"
import { getPublicGames } from "../server-data"
import { GameBrowser } from "../public-filters"

export default async function GamesPage({ params }: { params: Promise<{ guildId: string }> }) { 
  const { guildId } = await params
  const publicGames = await getPublicGames(guildId)
  return (
    <div className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24">
      <SectionHeading eyebrow="MATCH HISTORY" title="Games worth replaying." description="A live feed of the latest matches across every queue and map." />
      {publicGames.length > 0 ? (
        <GameBrowser games={publicGames} />
      ) : (
        <div className="p-8 border border-dashed border-white/10 rounded-xl text-center">
          <p className="font-mono text-xs text-white/40 uppercase tracking-wider">No games recorded yet.</p>
        </div>
      )}
    </div>
  )
}
