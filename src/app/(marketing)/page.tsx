import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Gauge,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { dbApi } from "@/lib/api-client";

const capabilities = [
  { icon: Bot, title: "Discord management", text: "Turn community actions into reliable, observable workflows." },
  { icon: Server, title: "Game server management", text: "Provision queues, lobbies, servers, and snapshots from one place." },
  { icon: Gauge, title: "Live activity", text: "See health, activity, and competitive signals without leaving your command center." },
  { icon: ShieldCheck, title: "Safety by default", text: "Keep moderation, sanctions, audit trails, and permissions close to the work." },
];

export default async function LandingPage() {
  const [guilds, players] = await Promise.allSettled([
    dbApi.guilds.count(),
    dbApi.players.count(),
  ]);
  const guildCount = guilds.status === "fulfilled" ? guilds.value.count : null;
  const playerCount = players.status === "fulfilled" ? players.value.count : null;
  const formatCount = (value: number | null) =>
    value === null ? "—" : new Intl.NumberFormat("en-US").format(value);
  const telemetryAvailable = guildCount !== null || playerCount !== null;

  return (
    <div className="relative overflow-hidden">
      <section className="relative mx-auto grid max-w-[95rem] gap-12 overflow-hidden px-4 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-24"><div className="pointer-events-none absolute -right-20 top-10 size-80 rounded-full bg-primary-500/10 blur-3xl" /><div className="pointer-events-none absolute right-24 top-20 hidden size-48 rotate-12 rounded-3xl border border-primary-500/20 lg:block" /><div className="pointer-events-none absolute right-16 top-32 hidden size-48 rotate-12 rounded-3xl border border-success/20 lg:block" />
        <div className="relative z-10 max-w-2xl">
          <div className="eyebrow"><CircleDot className="size-3 text-success" /> competitive infrastructure / online</div>
          <h1 className="mt-6 text-hero max-w-3xl">The command center for competitive communities.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-fg-muted">Operate Discord, matchmaking, game servers, moderation, and player progression from a single focused workspace built for teams that move fast.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/setup" className="button-primary"><span>Start configuring</span><ArrowRight className="size-4" /></Link>
            <Link href="/reference" className="button-secondary">Read the reference</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
            <span className="flex items-center gap-2"><Check className="size-3.5 text-success" /> Discord-native</span>
            <span className="flex items-center gap-2"><Check className="size-3.5 text-success" /> Built for operators</span>
            <span className="flex items-center gap-2"><Check className="size-3.5 text-success" /> Observable by default</span>
          </div>
        </div>

        <div className="command-preview panel-container relative z-10 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary-500"><Terminal className="size-4" /></span><div><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">workspace / operations</p><p className="text-sm font-semibold">Ranked Bedwars</p></div></div>
            <span className={`status-pill ${telemetryAvailable ? "status-success" : "status-warning"}`}><span className={`size-1.5 rounded-full ${telemetryAvailable ? "bg-success" : "bg-warning"}`} /> {telemetryAvailable ? "live data connected" : "data unavailable"}</span>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            {[
              ["Registered guilds", formatCount(guildCount), "database total"],
              ["Registered players", formatCount(playerCount), "database total"],
              ["Data source", telemetryAvailable ? "LIVE" : "—", telemetryAvailable ? "database API" : "unavailable"],
            ].map(([label, value, note]) => <div key={label} className="surface-inset rounded-lg p-3"><p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 font-mono text-[10px] text-success">{note}</p></div>)}
          </div>
          <div className="border-t border-border-subtle px-5 py-4"><div className="mb-3 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">live platform data</p><span className="font-mono text-[10px] text-fg-muted">server-rendered</span></div><p className="font-mono text-xs leading-6 text-fg-muted">Counts are read directly from the connected database when this page renders. No sample or placeholder metrics are shown.</p></div>
          <div className="flex items-center justify-between border-t border-border-subtle bg-panel-bg/60 px-5 py-3 font-mono text-[10px] text-fg-muted"><span>source: connected database</span><span className={`flex items-center gap-1.5 ${telemetryAvailable ? "text-success" : "text-warning"}`}><span className={`size-1.5 rounded-full ${telemetryAvailable ? "bg-success" : "bg-warning"}`} /> {telemetryAvailable ? "live" : "unavailable"}</span></div>
        </div>
      </section>

      <section className="border-y border-border-subtle bg-panel-bg/35"><div className="mx-auto grid max-w-[95rem] gap-3 border-b border-border-subtle px-4 py-5 sm:grid-cols-3 sm:px-8"><div className="surface-inset rounded-lg px-4 py-3"><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">01 / command</p><p className="mt-1 text-sm font-semibold">One operating surface</p></div><div className="surface-inset rounded-lg px-4 py-3"><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">02 / signal</p><p className="mt-1 text-sm font-semibold">Live state, not guesswork</p></div><div className="surface-inset rounded-lg px-4 py-3"><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">03 / control</p><p className="mt-1 text-sm font-semibold">Automations with context</p></div></div><div className="mx-auto max-w-[95rem] px-4 py-16 sm:px-8"><div className="max-w-2xl"><p className="eyebrow">one system / many surfaces</p><h2 className="mt-4 text-title">Everything your community needs to run cleanly.</h2><p className="mt-3 text-description">Replace scattered dashboards and manual handoffs with a workspace that keeps the important state visible.</p></div><div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{capabilities.map(({ icon: Icon, title, text }) => <div key={title} className="panel-container group p-5"><Icon className="size-5 text-primary-500 transition-transform group-hover:-translate-y-0.5" /><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-fg-muted">{text}</p><ChevronRight className="mt-5 size-4 text-fg-muted" /></div>)}</div></div></section>

      <section className="mx-auto grid max-w-[95rem] gap-10 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:items-center"><div><p className="eyebrow">from signal to action</p><h2 className="mt-4 text-title">A calmer operating rhythm for every match.</h2><p className="mt-4 max-w-xl text-description">Configure once, observe continuously, and give your team the context they need to make the next decision. Every page shares the same language, state, and affordances.</p><Link href="/setup" className="mt-7 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary-500 hover:text-primary-600">Explore the setup flow <ArrowRight className="size-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2"><div className="surface-inset rounded-xl border border-dashed border-primary-500/40 p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">01 / configure</p><p className="mt-3 font-semibold">Connect your community, queues, and game servers.</p></div><div className="surface-inset rounded-xl border border-border-subtle p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">02 / observe</p><p className="mt-3 font-semibold">Read health and player signals in real time.</p></div><div className="surface-inset rounded-xl border border-border-subtle p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">03 / automate</p><p className="mt-3 font-semibold">Let reliable workflows handle the repetitive work.</p></div><div className="surface-inset rounded-xl border border-border-subtle p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-fg-muted">04 / improve</p><p className="mt-3 font-semibold">Use history and audit trails to tune the system.</p></div></div></section>

      <section className="mx-auto max-w-[95rem] px-4 pb-20 sm:px-8"><div className="rounded-2xl border border-primary-500/25 bg-primary-50/40 px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between"><div><p className="eyebrow">ready when you are</p><h2 className="mt-4 text-title">Make the next match easier to operate.</h2></div><Link href="/setup" className="button-primary mt-7 lg:mt-0">Open the setup flow <ArrowRight className="size-4" /></Link></div></section>
    </div>
  );
}
