"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu, Swords, X } from "lucide-react"
import { useEffect, useState } from "react"
import { guildDomain } from "./data"

const links = [
  ["Overview", "/", "Home"], ["About", "/about", "The network"], ["Players", "/players", "Competitors"], ["Games", "/games", "Match history"], ["Leaderboard", "/leaderboard", "Season rankings"], ["Tier Lists", "/tier-lists", "Community rankings"], ["Creators", "/creators", "Featured voices"], ["Partners", "/partners", "Community partners"], ["Store", "/store", "Rewards"], ["Support", "/support", "Get help"],
] as const

/** The public guild site's shell: a fixed dark, game-branded palette (see the `--public-*` tokens in globals.css), independent of the dashboard's mutable theme presets. */
export function PublicShell({ guildId, guildName, children }: { guildId: string; guildName: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const base = "" // Use relative paths for subdomain routing
  useEffect(() => setOpen(false), [pathname])
  return <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[var(--public-bg)] text-[var(--public-fg)] selection:bg-[var(--public-accent)]/30 [scrollbar-gutter:stable]" style={{ backgroundImage: "linear-gradient(rgba(7,10,15,.94), rgba(7,10,15,.98)), url('/public-minecraft-ambience.png')", backgroundSize: 'cover', backgroundAttachment: 'fixed' }}><div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:48px_48px]" /><div className="pointer-events-none fixed -left-32 top-40 size-96 rounded-full bg-[var(--public-accent)]/[0.05] blur-3xl" /><div className="pointer-events-none fixed -right-40 bottom-20 size-[28rem] rounded-full bg-[var(--public-highlight)]/[0.04] blur-3xl" />
    <header className="relative sticky top-0 z-40 border-b border-[var(--public-border-soft)] bg-[var(--public-bg)]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[4.5rem] max-w-[95rem] items-center gap-5 px-5 sm:px-8">
        <Link href={base} className="flex min-w-0 shrink-0 items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[var(--public-accent)] text-[var(--public-accent-ink)] shadow-[0_0_24px_rgba(34,211,238,.22)]"><Swords className="size-4" /></span><span className="min-w-0"><strong className="block truncate text-xs tracking-[0.14em]">{guildName}</strong><span className="hidden text-xs text-white/35 sm:block">{guildDomain(guildId)}</span></span></Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex">{links.map(([label, suffix]) => { const href = `${base}${suffix}`; const active = pathname === href || (suffix === "/" && pathname === "/"); return <Link key={label} href={href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-lg border px-2.5 py-2 text-[10px] font-semibold transition-[background-color,border-color,color] duration-150 xl:px-3 xl:text-[11px] ${active ? "border-[var(--public-accent)]/20 bg-[var(--public-accent)]/[0.08] text-cyan-200" : "border-transparent text-white/50 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"}`}>{label}</Link> })}</nav>
        <button aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} className="ml-auto cursor-pointer rounded-lg border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden" onClick={() => setOpen(value => !value)}>{open ? <X className="size-4" /> : <Menu className="size-4" />}</button>
      </div>
      {open && <nav className="motion-fade border-t border-[var(--public-border-soft)] px-5 py-4 sm:px-8 lg:hidden"><div className="mx-auto grid max-w-[95rem] gap-1 sm:grid-cols-2">{links.map(([label, suffix, description]) => { const href = `${base}${suffix}`; return <Link key={label} href={href} className="flex items-center justify-between rounded-lg border border-transparent px-3 py-3 text-sm text-white/70 hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-white"><span>{label}</span><span className="text-xs text-white/30">{description}</span></Link> })}</div></nav>}
    </header>
    <main className="relative z-10 min-w-0 flex-1 motion-page">{children}</main>
    <footer className="relative z-10 mt-auto shrink-0 border-t border-[var(--public-border-soft)] bg-[var(--public-bg-deep)] px-5 py-5 sm:px-8"><div className="mx-auto flex max-w-[95rem] items-center justify-between gap-4 text-[10px] text-white/35"><span className="truncate">{guildName} <span className="text-white/15">·</span> Competitive community portal</span><span className="shrink-0 font-mono">{guildDomain(guildId)}</span></div></footer>
  </div>
}

/** Shared page wrapper for public sub-pages: consistent max-width, gutter and vertical rhythm, with entrance motion. Use instead of hand-rolling `mx-auto max-w-[95rem] px-5 py-16 …` per page. */
export function PublicSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`motion-page mx-auto max-w-[95rem] px-5 py-16 sm:px-8 sm:py-24 ${className}`}>{children}</div>
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="public-enter mb-10 flex flex-col items-center text-center"><p className="mb-3 text-[13px] font-semibold text-[var(--public-accent)]">{eyebrow}</p><h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/55">{description}</p></div> }
export function PublicCard({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) { return <div id={id} className={`public-card min-w-0 rounded-xl border border-[var(--public-border)] bg-[var(--public-surface)] shadow-[0_18px_48px_rgba(0,0,0,.12)] ${className}`}>{children}</div> }

export function PublicInfoPage({ guildId, eyebrow, title, description, cards }: { guildId: string; eyebrow: string; title: string; description: string; cards: { label: string; title: string; body: string }[] }) { return <PublicSection><SectionHeading eyebrow={eyebrow} title={title} description={description} /><div className="motion-stagger grid gap-4 md:grid-cols-2">{cards.map((card, index) => <PublicCard key={card.label} className="p-6 sm:p-8"><p className="text-xs text-[var(--public-accent)]">{String(index + 1).padStart(2, "0")} · {card.label}</p><h2 className="mt-4 text-xl font-bold">{card.title}</h2><p className="mt-3 text-sm leading-7 text-white/50">{card.body}</p></PublicCard>)}</div><PublicCard className="mt-6 flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8"><div><p className="text-xs text-[var(--public-highlight)]">Ready to compete?</p><h2 className="mt-2 text-2xl font-bold">Keep your climb moving.</h2></div><Link href="/leaderboard" className="flex items-center gap-2 rounded-xl bg-[var(--public-accent)] px-5 py-3 text-sm font-bold text-[var(--public-accent-ink)]">View rankings <ArrowRight className="size-4" /></Link></PublicCard></PublicSection> }
