import { ArrowLeft, Check, ChevronRight, CircleDot, Command, Gauge, RefreshCw, ShieldCheck, Swords } from "lucide-react";
import Link from "next/link";

const nodes = [
  { name: "Wiggle's Server", detail: "Server Owner · Click to open dashboard", pending: false, icon: ShieldCheck },
  { name: "Jartex Ranked Bedwars", detail: "Unconfigured. Click to deploy engine instance.", pending: true, icon: Swords },
  { name: "Pika Ranked Bedwars", detail: "Unconfigured. Click to deploy engine instance.", pending: true, icon: Gauge },
];

function NodeCard({ node }: { node: (typeof nodes)[number] }) {
  const Icon = node.icon;
  return (
    <Link href="/dashboard" className={`group flex items-center gap-4 rounded-xl border px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-primary-500/50 hover:bg-panel-bg/70 ${node.pending ? "border-dashed border-border-subtle/80 bg-panel-bg/20" : "border-border-subtle bg-panel-bg/45 shadow-xl shadow-black/10"}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${node.pending ? "border-secondary-500/30 bg-secondary-500/10 text-secondary-500" : "border-primary-500/25 bg-primary-500/10 text-primary-500"}`}><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1"><span className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-fg-default"><span className="truncate">{node.name}</span>{!node.pending && <Check className="size-3 text-success" />}</span><span className="mt-1 block truncate text-xs text-fg-muted">{node.detail}</span></span>
      <ChevronRight className="size-4 shrink-0 text-fg-muted transition-transform group-hover:translate-x-1 group-hover:text-primary-500" />
    </Link>
  );
}

export default function LandingPage() {
  return (
    <main className="relative isolate min-h-[calc(100vh-7rem)] overflow-hidden px-5 pb-16 pt-16 sm:px-8 lg:px-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklch,var(--color-primary-500)_10%,transparent),transparent_34rem)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <header className="mx-auto w-full max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-primary-500/25 bg-primary-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary-500"><CircleDot className="size-3" /> Select workspace node</div>
          <h1 className="text-hero text-balance">Choose your command center.</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-fg-muted sm:text-base">Jump into a configured guild or deploy a ranked Bedwars engine for a new community. Every node stays scoped, visible, and ready for action.</p>
          <label className="mt-8 flex h-11 items-center gap-3 rounded-lg border border-border-subtle bg-panel-bg/60 px-4 text-left shadow-2xl shadow-black/20 focus-within:border-primary-500/60"><Command className="size-4 shrink-0 text-fg-muted" /><input aria-label="Search indexing nodes" placeholder="Search indexing nodes..." className="min-w-0 flex-1 bg-transparent font-mono text-xs text-fg-default outline-none placeholder:text-fg-muted" /><RefreshCw className="size-3.5 shrink-0 text-fg-muted" /></label>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <section><div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted"><span className="text-primary-500">#</span> Configured workspaces <span className="rounded border border-border-subtle px-1.5 py-0.5 text-[9px] text-fg-muted">1 active</span></div><NodeCard node={nodes[0]} /><div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{[{ icon: Swords, title: "Matchmaking", text: "Queues, ranks, parties" }, { icon: Gauge, title: "Live insight", text: "Health and audit signals" }, { icon: ShieldCheck, title: "Guarded changes", text: "Safe configuration flows" }].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-3 rounded-lg border border-border-subtle/70 bg-panel-bg/35 px-3 py-3"><Icon className="size-4 text-primary-500" /><div><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-fg-default">{title}</p><p className="mt-0.5 text-xs text-fg-muted">{text}</p></div></div>)}</div></section>
          <section><div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-fg-muted"><span>⊙</span> Available guilds <span className="rounded border border-border-subtle px-1.5 py-0.5 text-[9px] text-fg-muted">2 pending</span></div><div className="flex flex-col gap-3">{nodes.slice(1).map((node) => <NodeCard key={node.name} node={node} />)}</div></section>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-border-subtle/60 pt-5"><Link href="/setup" className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2.5 font-mono text-[11px] font-bold text-fg-default transition-colors hover:border-primary-500/60 hover:text-primary-500"><ArrowLeft className="size-3.5" /> Back to verification</Link><span className="hidden font-mono text-[10px] uppercase tracking-widest text-fg-muted sm:block">Platform orchestration node stable</span></div>
      </div>
    </main>
  );
}
