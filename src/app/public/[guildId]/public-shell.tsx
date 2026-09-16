"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, ArrowRight, Gamepad2, Menu, ShoppingBag, Swords, Trophy, Users, X } from "lucide-react"
import { useEffect, useState } from "react"
import { guildDisplayName, guildDomain } from "./data"
import { ThemeScope } from "@/components/shared/theme-scope"

const links = [
  ["Overview", "", "Home"], ["About", "/about", "The network"], ["Players", "/players", "Competitors"], ["Games", "/games", "Match history"], ["Leaderboard", "/leaderboard", "Season rankings"], ["Tier Lists", "/tier-lists", "Community rankings"], ["Creators", "/creators", "Featured voices"], ["Partners", "/partners", "Community partners"], ["Store", "/store", "Rewards"], ["Support", "/support", "Get help"],
] as const

export function PublicShell({ guildId, children }: { guildId: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const base = `/public/${guildId}`
  useEffect(() => setOpen(false), [pathname])
  return <ThemeScope><div className="relative min-h-screen overflow-x-hidden bg-[#070a0f] text-white selection:bg-cyan-400/30"><div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:48px_48px]" /><div className="pointer-events-none fixed -left-32 top-40 size-96 rounded-full bg-cyan-400/[0.05] blur-3xl" /><div className="pointer-events-none fixed -right-40 bottom-20 size-[28rem] rounded-full bg-amber-300/[0.04] blur-3xl" />
    <header className="relative sticky top-0 z-40 border-b border-white/[0.08] bg-[#070a0f]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.5rem] max-w-[95rem] items-center gap-5 px-5 sm:px-8">
        <Link href={base} className="flex min-w-0 shrink-0 items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-cyan-400 text-[#071016] shadow-[0_0_24px_rgba(34,211,238,.22)]"><Swords className="size-4" /></span><span className="min-w-0"><strong className="block truncate text-xs tracking-[0.14em]">{guildDisplayName(guildId)}</strong><span className="hidden font-mono text-[9px] text-white/35 sm:block">{guildDomain(guildId)}</span></span></Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex">{links.map(([label, suffix]) => { const href = `${base}${suffix}`; const active = pathname === href || (suffix === "" && pathname === base); return <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-lg border px-2.5 py-2 text-[10px] font-semibold transition-colors xl:px-3 xl:text-[11px] ${active ? "border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200" : "border-transparent text-white/50 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"}`}>{label}</Link> })}</nav>
        <button aria-label={open ? "Close navigation" : "Open navigation"} className="ml-auto rounded-lg border border-white/10 p-2 text-white/70 lg:hidden" onClick={() => setOpen(value => !value)}>{open ? <X className="size-4" /> : <Menu className="size-4" />}</button>
      </div>
      {open && <nav className="border-t border-white/[0.08] px-5 py-4 sm:px-8 lg:hidden"><div className="mx-auto grid max-w-[95rem] gap-1 sm:grid-cols-2">{links.map(([label, suffix, description]) => { const href = `${base}${suffix}`; return <Link key={label} href={href} className="flex items-center justify-between rounded-lg border border-transparent px-3 py-3 text-sm text-white/70 hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-white"><span>{label}</span><span className="font-mono text-[10px] text-white/30">{description}</span></Link> })}</div></nav>}
    </header>
    <main className="relative z-10 motion-page">{children}</main>
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#05080c] px-5 py-5 sm:px-8"><div className="mx-auto flex max-w-[95rem] items-center justify-between gap-4 text-[10px] text-white/35"><span className="truncate">{guildDisplayName(guildId)} <span className="text-white/15">·</span> Competitive community portal</span><span className="shrink-0 font-mono">{guildDomain(guildId)}</span></div></footer>
  </div></ThemeScope>
}

export const publicIcons = { Users, Trophy, ShoppingBag, Gamepad2, Activity }
export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="public-enter mb-10"><p className="mb-3 font-mono text-[11px] font-bold tracking-[0.24em] text-cyan-300">// {eyebrow}</p><h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/55">{description}</p></div> }
export function PublicCard({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) { return <div id={id} className={`public-card rounded-xl border border-white/[0.09] bg-white/[0.025] shadow-[0_18px_48px_rgba(0,0,0,.12)] ${className}`}>{children}</div> }

export function PublicInfoPage({ guildId, eyebrow, title, description, cards }: { guildId: string; eyebrow: string; title: string; description: string; cards: { label: string; title: string; body: string }[] }) { const base = `/public/${guildId}`; return <div className="mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24"><SectionHeading eyebrow={eyebrow} title={title} description={description} /><div className="grid gap-4 md:grid-cols-2">{cards.map((card, index) => <PublicCard key={card.label} className="p-6 sm:p-8"><p className="font-mono text-[10px] tracking-[.2em] text-cyan-300">{String(index + 1).padStart(2, "0")} / {card.label.toUpperCase()}</p><h2 className="mt-4 text-xl font-bold">{card.title}</h2><p className="mt-3 text-sm leading-7 text-white/50">{card.body}</p></PublicCard>)}</div><PublicCard className="mt-6 flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8"><div><p className="font-mono text-[10px] tracking-[.2em] text-amber-200">READY TO COMPETE?</p><h2 className="mt-2 text-2xl font-black">Keep your climb moving.</h2></div><Link href={`${base}/leaderboard`} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#071016]">View rankings <ArrowRight className="size-4" /></Link></PublicCard></div> }
