"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Gamepad2, Menu, Swords, Trophy, Users, ShoppingBag, X, Activity } from "lucide-react"
import { useState } from "react"
import { guildDisplayName, guildDomain } from "./data"
import { ThemeScope } from "@/components/shared/theme-scope"

const links = [
  ["Overview", "", "Command center"],
  ["Players", "/players", "Browse competitors"],
  ["Games", "/games", "Live match history"],
  ["Leaderboard", "/leaderboard", "Season rankings"],
  ["Store", "/store", "Community rewards"],
]

export function PublicShell({ guildId, children }: { guildId: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const base = `/public/${guildId}`
  return <ThemeScope><div className="flex min-h-screen bg-[#070a0f] text-white selection:bg-cyan-400/30">
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.08] bg-[#090d15] px-4 py-5 lg:flex">
      <Link href={base} className="mb-10 flex items-center gap-3 px-2"><span className="grid size-10 place-items-center rounded-xl bg-cyan-400 text-[#071016] shadow-[0_0_24px_rgba(34,211,238,.22)]"><Swords className="size-5" /></span><span><strong className="block text-sm tracking-[0.14em]">{guildDisplayName(guildId)}</strong><span className="font-mono text-[10px] text-white/35">{guildDomain(guildId)}</span></span></Link>
      <p className="mb-3 px-2 font-mono text-[9px] font-bold tracking-[0.22em] text-white/25">COMMUNITY CONSOLE</p>
      <nav className="flex flex-col gap-1">{links.map(([label, suffix, description]) => { const active = pathname === `${base}${suffix}`; return <Link key={label} href={`${base}${suffix}`} aria-current={active ? "page" : undefined} className={`group flex items-center justify-between rounded-xl border px-3 py-3 transition-all ${active ? "border-cyan-300/20 bg-cyan-300/[0.09] text-cyan-200" : "border-transparent text-white/50 hover:border-white/[0.08] hover:bg-white/[0.05] hover:text-white"}`}><span className="text-sm font-semibold">{label}</span><span className="font-mono text-[9px] text-white/25 group-hover:text-white/45">{description}</span></Link> })}</nav>
      <div className="mt-auto space-y-3"><div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-3"><div className="flex items-center gap-2 font-mono text-[10px] text-emerald-300"><i className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> SERVER ONLINE</div><p className="mt-2 text-xs leading-5 text-white/35">Season 14 is live. Queue, compete, and climb.</p></div><Link href={`${base}/leaderboard`} className="flex items-center justify-between rounded-xl bg-cyan-400 px-3 py-3 text-xs font-bold text-[#071016]">View rankings <ArrowRight className="size-3.5" /></Link></div>
    </aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070a0f]/85 backdrop-blur-xl lg:hidden"><div className="flex h-16 items-center justify-between px-5"><Link href={base} className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-lg bg-cyan-400 text-[#071016]"><Swords className="size-4" /></span><strong className="text-xs tracking-[0.14em]">{guildDisplayName(guildId)}</strong></Link><button aria-label="Toggle navigation" className="rounded-lg p-2 text-white/70" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>{open && <nav className="flex flex-col gap-1 border-t border-white/[0.08] px-5 py-4">{links.map(([label, suffix, description]) => <Link key={label} href={`${base}${suffix}`} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg border border-transparent px-3 py-3 text-sm text-white/70 hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-white"><span>{label}</span><span className="font-mono text-[10px] text-white/30">{description}</span></Link>)}</nav>}</header><main className="motion-page">{children}</main><footer className="border-t border-white/[0.08] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[95rem] flex-col justify-between gap-4 text-xs text-white/40 sm:flex-row"><span>{guildDisplayName(guildId)} · Competitive community portal</span><span className="font-mono">POWERED BY MYRBW.DEV</span></div></footer></div>
  </div></ThemeScope>
}

export const publicIcons = { Users, Trophy, ShoppingBag, Gamepad2, Activity }
export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="public-enter mb-10"><p className="mb-3 font-mono text-[11px] font-bold tracking-[0.24em] text-cyan-300">// {eyebrow}</p><h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/55">{description}</p></div> }
export function PublicCard({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <div className={`public-card rounded-xl border border-white/[0.09] bg-white/[0.025] shadow-[0_18px_48px_rgba(0,0,0,.12)] ${className}`}>{children}</div> }
