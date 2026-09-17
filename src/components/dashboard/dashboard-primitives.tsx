"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("rounded-xl border border-border-subtle bg-panel-bg/20 p-5 shadow-sm backdrop-blur-md", className)} {...props} />;
}

export function DashboardPanelHeader({ className, title, description, action, ...props }: HTMLAttributes<HTMLDivElement> & { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4 border-b border-border-subtle/50 pb-2.5", className)} {...props}>
      <div className="min-w-0 text-left">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-fg-default">{title}</h2>
        {description ? <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function DashboardField({ className, label, hint, children, ...props }: HTMLAttributes<HTMLDivElement> & { label: ReactNode; hint?: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted">{label}</label>
      {children}
      {hint ? <p className="font-mono text-[9px] leading-relaxed text-fg-muted">{hint}</p> : null}
    </div>
  );
}

export function DashboardIconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn("inline-flex size-8 items-center justify-center rounded-md border border-border-subtle text-fg-muted transition-colors hover:border-primary-500/40 hover:bg-panel-bg/60 hover:text-fg-default focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50", className)} {...props} />;
}
