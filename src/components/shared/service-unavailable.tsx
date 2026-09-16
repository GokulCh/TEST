"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface ServiceUnavailableProps {
  onRetry: () => void;
  retryInSeconds?: number;
}

export function ServiceUnavailable({ onRetry, retryInSeconds = 60 }: ServiceUnavailableProps) {
  const [seconds, setSeconds] = useState(retryInSeconds);

  useEffect(() => {
    setSeconds(retryInSeconds);
    const timer = window.setInterval(() => {
      setSeconds((current) => (current <= 1 ? retryInSeconds : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryInSeconds]);

  return (
    <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
      <section role="alert" aria-live="polite" className="w-full max-w-lg rounded-xl border border-warning/30 bg-panel-bg/60 p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-warning/30 bg-warning/10">
          <AlertTriangle className="size-5 text-warning" aria-hidden="true" />
        </div>
        <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-warning">Service unavailable</p>
        <h2 className="mt-3 text-xl font-semibold text-fg-default">We could not load this guild</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-fg-muted">The database service is currently down or unreachable. Please try again later. We will retry automatically every 60 seconds.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90">
            <RefreshCw className="size-3.5" aria-hidden="true" /> Try again now
          </button>
          <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">Next retry in {seconds}s</span>
        </div>
      </section>
    </div>
  );
}
