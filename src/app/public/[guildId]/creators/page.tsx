"use client"

import { ExternalLink, Play, Users, Video } from "lucide-react"
import { PublicCard, SectionHeading } from "../public-shell"

export default function CreatorsPage() {
  return <main className="mx-auto max-w-[95rem] px-5 py-14 sm:px-8 sm:py-24"><SectionHeading eyebrow="CREATOR NETWORK" title="Watch the pros play." description="Learn from the players, analysts, and community voices turning every match into a better way to climb." /><div className="mx-auto mt-12 max-w-5xl p-8 border border-dashed border-white/10 rounded-xl text-center"><p className="font-mono text-xs text-white/40 uppercase tracking-wider">No featured creators configured for this guild yet.</p></div></main>
}
