import { Swords } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-canvas text-fg-default font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      
      {/* PERSISTENT HEADER FRAME - Extends to 1520px wide layout grid constraints */}
      <header className="sticky top-0 z-sticky border-b border-border-subtle bg-bg-canvas/50 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[95rem] items-center justify-between px-8">
          
          <Link href="/" className="flex items-center gap-2.5 font-bold hover:opacity-90 transition-opacity">
            <span className="flex-center size-7 rounded-md bg-primary-50 text-primary-500 shadow-sm border border-border-subtle">
              <Swords className="size-4" />
            </span>
            <span className="font-display font-bold text-sm tracking-tight text-fg-default">
              myrbw.dev
            </span>
          </Link>

          <div className="flex items-center gap-6 text-[10px] font-mono font-bold text-fg-muted tracking-widest select-none uppercase">
            // cluster.v2.engine
          </div>

        </div>
      </header>

      {/* FULL RESPONSIVE CONTENT AREA */}
      <main className="flex-1 w-full flex flex-col justify-center">
        {children}
      </main>

      {/* FOOTER CONTAINER */}
      <footer className="border-t border-border-subtle py-5 bg-panel-bg/30 backdrop-blur-xs">
        <div className="mx-auto max-w-[95rem] px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-fg-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" /> 
            Platform Orchestrator Node Stable
          </span>
          <span>&copy; {new Date().getFullYear()} myrbw.dev. Engineered for competitive Minecraft clusters.</span>
        </div>
      </footer>

    </div>
  );
}