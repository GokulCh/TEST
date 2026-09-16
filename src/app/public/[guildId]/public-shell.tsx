"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu, Swords, Trophy, Users, ShoppingBag, Gamepad2, X } from "lucide-react"
import { useState } from "react"
import { guildDisplayName, guildDomain } from "./data"
import { ThemeScope } from "@/components/shared/theme-scope"

const links = [
  ["Overview", ""], ["Players", "/players"], ["Games", "/games"], ["Leaderboard", "/leaderboard"], ["Store", "/store"],
]

export function PublicShell({ guildId, children }: { guildId: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const base = `/public/${guildId}`
  return <ThemeScope><div className="flex min-h-screen flex-col bg-[#070a0f] text-white selection:bg-cyan-400/30">
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070a0f]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href={base} className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-[#071016] shadow-[0_0_24px_rgba(34,211,238,.22)] transition-transform group-hover:rotate-6"><Swords className="size-4" /></span>
          <span><strong className="block text-sm tracking-[0.18em]">{guildDisplayName(guildId)}</strong><span className="font-mono text-[10px] text-white/40">{guildDomain(guildId)}</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([label, suffix]) => { const active = pathname === `${base}${suffix}`; return <Link key={label} href={`${base}${suffix}`} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${active ? "bg-white/[0.1] text-cyan-300" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}>{label}</Link> })}
        </nav>
        <div className="hidden items-center gap-3 md:flex"><span className="flex items-center gap-2 font-mono text-[10px] text-emerald-300"><i className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> SERVER ONLINE</span><Link href={`${base}/players`} className="flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-[#071016] transition-transform hover:-translate-y-0.5">View stats <ArrowRight className="size-3.5" /></Link></div>
        <button aria-label="Toggle navigation" className="rounded-lg p-2 text-white/70 md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav className="flex flex-col gap-1 border-t border-white/[0.08] px-5 py-4 md:hidden">{links.map(([label, suffix]) => <Link key={label} href={`${base}${suffix}`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white">{label}</Link>)}</nav>}
    </header>
    <main className="flex-1">{children}</main>
    <footer className="border-t border-white/[0.08] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-white/40 sm:flex-row"><span>{guildDisplayName(guildId)} · Competitive community portal</span><span className="font-mono">POWERED BY MYRBW.DEV</span></div></footer>
  </div></ThemeScope>
}

export const publicIcons = { Users, Trophy, ShoppingBag, Gamepad2 }

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="public-enter mb-10"><p className="mb-3 font-mono text-[11px] font-bold tracking-[0.24em] text-cyan-300">// {eyebrow}</p><h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/55">{description}</p></div> }

export function PublicCard({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <div className={`public-card rounded-2xl border border-white/[0.09] bg-white/[0.025] ${className}`}>{children}</div> }
