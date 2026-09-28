import { PublicCard, SectionHeading } from "../public-shell"

export default async function StorePage({ params }: { params: Promise<{ guildId: string }> }) { 
  await params; 
  return <div className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24"><SectionHeading eyebrow="Community store" title="Back the network." description="Optional supporter perks that keep the servers fast and the competition fair." /><div className="p-8 border border-dashed border-white/10 rounded-xl text-center"><p className="text-xs text-white/40">No store items configured for this guild yet.</p></div></div> 
}
