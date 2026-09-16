import { ArrowRight, Gauge, ShieldCheck, Swords } from "lucide-react";

export function HomeSection() {
  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden px-6 py-20 sm:px-10">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary-500/25 bg-primary-500/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-primary-500">
            <span className="size-1.5 rounded-full bg-success shadow-[0_0_12px_var(--color-success)]" />
            Control plane online
          </div>
          <h1 className="text-hero max-w-3xl text-balance">The command center for ranked Bedwars.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
            Configure, manage, and monitor your Discord competition stack from one focused workspace built for fast decisions.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-500 px-5 font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:-translate-y-0.5 hover:bg-primary-600">
              Open dashboard <ArrowRight className="size-4" />
            </a>
            <span className="font-mono text-[11px] uppercase tracking-widest text-fg-muted">Guild scoped configuration</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {[{ icon: Swords, title: "Matchmaking", text: "Queues, ranks, parties" }, { icon: Gauge, title: "Live insight", text: "Health and audit signals" }, { icon: ShieldCheck, title: "Guarded changes", text: "Safe configuration flows" }].map(({ icon: Icon, title, text }) => (
            <div key={title} className="panel-container flex items-center gap-4 border-white/10 bg-panel-bg/70 p-4 shadow-xl shadow-black/10 transition-transform hover:-translate-y-0.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-500"><Icon className="size-5" /></span>
              <div><p className="font-semibold text-fg-default">{title}</p><p className="mt-0.5 text-sm text-fg-muted">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
