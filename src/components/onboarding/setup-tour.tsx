"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const TOUR_COOKIE = "rbw_setup_tour_completed";

type TourStep = {
  eyebrow: string;
  title: string;
  body: string;
  target: string;
  side: "right" | "bottom";
};

const steps: TourStep[] = [
  {
    eyebrow: "01 // ORIENTATION",
    title: "This is your command center",
    body: "The overview keeps your guild health, registered players, active matches, and bot identity in one place.",
    target: "[data-tour='overview-stats']",
    side: "bottom",
  },
  {
    eyebrow: "02 // MODULE MATRIX",
    title: "Everything starts here",
    body: "Use the sidebar to move between matchmaking, infrastructure, sanctions, tickets, and creator tools.",
    target: "[data-tour='sidebar']",
    side: "right",
  },
  {
    eyebrow: "03 // BOT IDENTITY",
    title: "Make the bot yours",
    body: "Set the nickname, avatar, banner, and profile description your community will see in Discord.",
    target: "[data-tour='bot-identity']",
    side: "right",
  },
  {
    eyebrow: "04 // COMMAND PROTOCOL",
    title: "Commands are configurable",
    body: "Open Commands from the sidebar to configure prefixes, slash commands, permissions, cooldowns, and routing rules.",
    target: "[data-tour='commands-nav']",
    side: "right",
  },
  {
    eyebrow: "05 // READY TO CONFIGURE",
    title: "You are ready to build",
    body: "Configure queues, commands, roles, and portals at your own pace. You can restart this guide from the dashboard anytime.",
    target: "[data-tour='sidebar']",
    side: "right",
  },
];

function hasTourCookie() {
  return typeof document !== "undefined" && document.cookie.split("; ").some((cookie) => cookie.startsWith(`${TOUR_COOKIE}=`));
}

function completeTour() {
  document.cookie = `${TOUR_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
}

export function SetupTour() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[stepIndex];

  const shouldStart = useMemo(() => {
    return pathname?.match(/^\/dashboard\/[^/]+\/?$/) && (searchParams.get("tour") === "1" || !hasTourCookie());
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!shouldStart) return;
    const timer = window.setTimeout(() => setVisible(true), 450);
    return () => window.clearTimeout(timer);
  }, [shouldStart]);

  useEffect(() => {
    if (!visible) return;
    const target = document.querySelector(step.target) ?? document.querySelector("[data-tour='overview-stats']");
    if (!target) return;
    const update = () => setTargetRect(target.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.target, visible]);

  if (!visible || !targetRect) return null;

  const finish = () => {
    completeTour();
    setVisible(false);
    if (searchParams.get("tour") === "1") router.replace(pathname);
  };

  const isLast = stepIndex === steps.length - 1;
  const cardStyle = step.side === "right"
    ? { top: Math.max(24, Math.min(window.innerHeight - 260, targetRect.top + targetRect.height / 2 - 110)), left: Math.min(window.innerWidth - 380, targetRect.right + 28) }
    : { top: Math.min(window.innerHeight - 260, targetRect.bottom + 28), left: Math.max(24, Math.min(window.innerWidth - 380, targetRect.left + targetRect.width / 2 - 180)) };

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="setup-tour-title">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]" />
      <div className="absolute rounded-xl border border-primary-500/70 bg-panel-bg shadow-[0_0_0_9999px_rgba(0,0,0,.42),0_0_45px_rgba(0,191,255,.16)]" style={{ top: targetRect.top - 8, left: targetRect.left - 8, width: targetRect.width + 16, height: targetRect.height + 16 }} />
      <svg className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        <path d={step.side === "right" ? `M ${targetRect.right + 6} ${targetRect.top + targetRect.height / 2} C ${targetRect.right + 70} ${targetRect.top + targetRect.height / 2}, ${cardStyle.left - 55} ${cardStyle.top + 70}, ${cardStyle.left - 8} ${cardStyle.top + 70}` : `M ${targetRect.left + targetRect.width / 2} ${targetRect.bottom + 6} C ${targetRect.left + targetRect.width / 2} ${targetRect.bottom + 55}, ${cardStyle.left + 180} ${cardStyle.top - 50}, ${cardStyle.left + 180} ${cardStyle.top - 8}`} fill="none" stroke="var(--color-primary-500)" strokeWidth="2" strokeDasharray="7 8" />
        <path d={step.side === "right" ? `M ${cardStyle.left - 8} ${cardStyle.top + 70} l 10 -6 M ${cardStyle.left - 8} ${cardStyle.top + 70} l 10 6` : `M ${cardStyle.left + 180} ${cardStyle.top - 8} l -6 10 M ${cardStyle.left + 180} ${cardStyle.top - 8} l 6 10`} fill="none" stroke="var(--color-primary-500)" strokeWidth="2" />
      </svg>
      <section className="absolute w-[min(360px,calc(100vw-32px))] rounded-xl border border-primary-500/35 bg-panel-bg p-5 shadow-2xl" style={cardStyle}>
        <div className="flex items-start justify-between gap-4">
          <p className="font-mono text-[10px] font-bold tracking-[.18em] text-primary-500">{step.eyebrow}</p>
          <button type="button" onClick={finish} aria-label="Skip setup guide" className="text-fg-muted transition-colors hover:text-fg-default"><X /></button>
        </div>
        <h2 id="setup-tour-title" className="mt-3 text-xl font-black tracking-tight text-fg-default">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-fg-muted">{step.body}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">{stepIndex + 1} / {steps.length}</span>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && <button type="button" onClick={() => setStepIndex((index) => index - 1)} className="inline-flex items-center gap-1 rounded-md border border-border-subtle px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted hover:text-fg-default"><ArrowLeft /> Back</button>}
            <button type="button" onClick={isLast ? finish : () => setStepIndex((index) => index + 1)} className="inline-flex items-center gap-1 rounded-md bg-primary-500 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white hover:bg-primary-600">{isLast ? <Check /> : <ArrowRight />} {isLast ? "Finish" : "Next"}</button>
          </div>
        </div>
        <button type="button" onClick={finish} className="mt-3 w-full text-center font-mono text-[10px] uppercase tracking-wider text-fg-muted hover:text-fg-default">Skip guide</button>
      </section>
    </div>
  );
}
