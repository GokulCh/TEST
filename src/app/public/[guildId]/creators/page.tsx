"use client"

import { ExternalLink, Play, Users, Video } from "lucide-react"
import { PublicCard, SectionHeading } from "../public-shell"

export default function CreatorsPage() {
  return <main className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24"><SectionHeading eyebrow="Creator network" title="Watch the pros play." description="Learn from the players, analysts, and community voices turning every match into a better way to climb." /><div className="mx-auto mt-12 max-w-5xl p-8 border border-dashed border-white/10 rounded-xl text-center"><p className="text-xs text-white/40">No featured creators configured for this guild yet.</p></div></main>
}
