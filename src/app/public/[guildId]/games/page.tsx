import { SectionHeading } from "../public-shell"
import { dbApi } from "@/lib/api-client"
import { GameBrowser } from "../public-filters"

export default async function GamesPage({ params }: { params: Promise<{ guildId: string }> }) { const { guildId } = await params; let games = []; try { games = await dbApi.games.list(guildId) } catch {} return <div className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24"><SectionHeading eyebrow="MATCH HISTORY" title="Games worth replaying." description="A live feed of the latest matches across every queue and map." /><GameBrowser games={games} /></div> }
