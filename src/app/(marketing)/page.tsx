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
    <div className="relative bg-[#070a0f]">
      <section className="relative mx-auto grid max-w-[95rem] gap-12 px-4 pb-20 pt-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-24">
        <div className="relative z-10 max-w-2xl"><div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-500/25 bg-panel-bg/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.18em] text-primary-500 backdrop-blur"><span className="size-1.5 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,.8)]" /> Season board online</div>
          <div className="eyebrow"><CircleDot className="size-3 text-success" /> competitive infrastructure / online</div>
          <h1 className="mt-6 text-hero max-w-3xl">The command center for competitive communities.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-fg-muted">Operate Discord, matchmaking, game servers, moderation, and player progression from a single focused workspace built for teams that move fast.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/setup" className="button-primary"><span>Start configuring</span><ArrowRight className="size-4" /></Link>
            <Link href="/reference" className="button-secondary">Read the reference</Link>
          </div>
          <div className="mt-8 flex items-center gap-3"><div className="flex -space-x-2">{['_Wiggels','PRBW','Maven'].map((name) => <img key={name} src={`https://mc-heads.net/avatar/${name}/34`} alt={`${name} Minecraft avatar`} className="size-8 rounded-full border-2 border-[#070a0f] bg-panel-bg" />)}</div><p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">Players already in the climb</p></div><div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
            <span className="flex items-center gap-2"><Check className="size-3.5 text-success" /> Discord-native</span>
            <span className="flex items-center gap-2"><Check className="size-3.5 text-success" /> Built for operators</span>
            <span className="flex items-center gap-2"><Check className="size-3.5 text-success" /> Observable by default</span>
          </div>
        </div>

        <div className="command-preview panel-container relative z-10 overflow-hidden border-primary-500/20 bg-panel-bg/75 p-0 shadow-[0_24px_100px_rgba(0,0,0,.34)] backdrop-blur"><div className="absolute -right-16 -top-16 size-40 rounded-full bg-primary-500/10 blur-3xl" />
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
    </div>
  )
}
