import { ArrowRight, Bot, Server, Terminal } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative w-full px-8 lg:px-16 py-16 lg:py-24 overflow-hidden">
      
      {/* 🌌 IMMERSIVE COMPONENT BACKDROP GLOW ANCHORS (Utilizes variables bound to system light/dark coordinates) */}
      {/* <div aria-hidden className="pointer-events-none absolute inset-0 -z-index-dropdown overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75rem] h-[45rem] bg-primary-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-[35rem] h-[35rem] bg-secondary-500/5 rounded-full blur-[120px]" />
      </div> */}

      {/* ASYMMETRIC FLUID GRID CONTAINER - Max-w constraints let page layouts expand across wide viewports */}
      <div className="mx-auto max-w-[90rem] grid lg:grid-cols-12 gap-16 items-center">
        
        {/* ================= LEFT SECTION: BRAND CONTENT DECLARATIONS ================= */}
        <div className="lg:col-span-5 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary-50 border border-primary-500/20 text-primary-500 text-[10px] font-mono font-bold uppercase tracking-widest select-none">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-primary-500" />
            </span>
            Core Three-Layer Hub
          </div>
          
          <h1 className="text-hero text-fg-default font-black tracking-tighter">
            Build your own Competitive System
          </h1>
          
          <p className="text-description max-w-xl font-medium">
            A fully automated competitive engine decoupling your Discord interaction layer from headless Mineflayer bot clusters. Configure telemetry settings, track progression pipelines, and host instances seamlessly.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link 
              href="/setup" 
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-mono font-bold text-xs uppercase tracking-wider h-12 px-8 rounded-control transition-all shadow-lg shadow-primary-500/10 active:scale-98 cursor-pointer"
            >
              Get Started <ArrowRight className="size-4" />
            </Link>
            <Link 
              href="/reference" 
              className="inline-flex items-center border border-border-subtle bg-panel-bg/40 hover:bg-panel-bg text-fg-default font-bold text-xs h-12 px-8 rounded-control transition-colors cursor-pointer"
            >
              Open Developer Docs
            </Link>
          </div>
        </div>

        {/* ================= RIGHT SECTION: HIGH-DENSITY INTERFACE TILES ================= */}
        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5 relative select-none">
          
          {/* Card 1: Bot Telemetry Monitor */}
          <div className="panel-container glow-primary bg-panel-bg/40 backdrop-blur-md space-y-4 hover:border-primary-500/30 transition-all duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-fg-default">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-secondary-500" /> bot-orchestrator
              </div>
              <span className="text-[9px] font-mono font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/10">
                ONLINE
              </span>
            </div>
            <div className="font-mono text-[11px] text-fg-muted space-y-1.5">
              <div className="flex justify-between border-b border-border-subtle/40 pb-1">Active Lobbies: <span className="text-fg-default font-semibold">14 VC channels</span></div>
              <div className="flex justify-between">Gateway Heartbeat: <span className="text-fg-default font-semibold">42ms network</span></div>
            </div>
          </div>

          {/* Card 2: Server Allocation Worker Node */}
          <div className="panel-container glow-secondary bg-panel-bg/40 backdrop-blur-md space-y-4 hover:border-secondary-500/30 transition-all duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-fg-default">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-success" /> node-session-pool
              </div>
              <span className="text-[9px] font-mono font-semibold text-fg-muted bg-bg-canvas px-2 py-0.5 rounded-md border border-border-subtle">
                IPC Shared
              </span>
            </div>
            <div className="font-mono text-[11px] text-fg-muted space-y-1.5">
              <div className="flex justify-between border-b border-border-subtle/40 pb-1">Pool Status: <span className="text-success font-bold">4 / 4 Nodes</span></div>
              <div className="flex justify-between">Preset Adapter: <span className="text-secondary-500 font-semibold">pika.preset.ts</span></div>
            </div>
          </div>

          {/* Card 3: Finite State Machine Telemetry Feed */}
          <div className="panel-container bg-panel-bg/40 backdrop-blur-md space-y-3 sm:col-span-2 border-border-subtle/80">
            <div className="flex items-center gap-2 text-xs font-bold text-fg-default border-b border-border-subtle/40 pb-2">
              <Terminal className="size-4 text-primary-500" /> game-lifecycle-fsm
            </div>
            <div className="font-mono text-[11px] space-y-1">
              <div className="text-fg-muted/60">[02:14] <span className="text-fg-default font-bold">STAGE_MUTATE:</span> IN_GAME</div>
              <div className="text-fg-muted/60">[02:15] <span className="text-primary-500 font-bold">TELEMETRY:</span> Bed broken (Red Team)</div>
              <div className="text-fg-muted/60">[02:19] <span className="text-success font-bold">PERSISTENCE:</span> Committing ELO scores row</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}