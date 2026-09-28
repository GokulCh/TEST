import { ArrowUpRight, ChevronDown, Globe2, ShieldCheck, Users } from "@/components/shared/icons"
import { PublicCard, SectionHeading } from "../public-shell"

export default function PartnersPage() {
  return <main className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24"><SectionHeading eyebrow="Community partners" title="Our partners." description="The communities, teams, and builders helping make competitive play more open, useful, and fun." /><div className="mx-auto mt-12 max-w-6xl p-8 border border-dashed border-white/10 rounded-xl text-center"><p className="text-xs text-white/40">No community partners configured for this guild yet.</p></div></main>
}
