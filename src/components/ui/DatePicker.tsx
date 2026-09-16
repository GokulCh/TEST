"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return value && year && month && day ? new Date(year, month - 1, day) : new Date();
}

const toValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function DatePicker({ value, onChange, placeholder = "Select date" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseDate(value));
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ? parseDate(value) : null;
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return <div ref={ref} className="relative z-20">
    <button type="button" onClick={() => setOpen((current) => !current)} className="w-full h-8 px-2.5 flex items-center justify-between gap-2 bg-bg-canvas/40 border border-border-subtle rounded-md font-mono text-xs text-fg-default hover:border-primary-500/50 focus:outline-none focus:border-primary-500/50">
      <span className={value ? "text-fg-default" : "text-fg-muted"}>{value || placeholder}</span><CalendarDays className="size-3.5 text-fg-muted" />
    </button>
    {open && <div className="absolute top-full left-0 mt-2 w-64 p-3 rounded-lg border border-border-subtle bg-panel-bg shadow-2xl" role="dialog" aria-label={placeholder}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" aria-label="Previous month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="size-7 grid place-items-center rounded hover:bg-bg-canvas text-fg-muted hover:text-fg-default"><ChevronLeft className="size-4" /></button>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-fg-default">{month.toLocaleString("en-US", { month: "long", year: "numeric" })}</span>
        <button type="button" aria-label="Next month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="size-7 grid place-items-center rounded hover:bg-bg-canvas text-fg-muted hover:text-fg-default"><ChevronRight className="size-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day} className="text-center font-mono text-[9px] text-fg-muted">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">{days.map((date) => { const currentMonth = date.getMonth() === month.getMonth(); const isSelected = selected && toValue(date) === toValue(selected); return <button type="button" key={date.toISOString()} onClick={() => { onChange(toValue(date)); setOpen(false); }} className={`h-7 rounded font-mono text-[10px] ${currentMonth ? "text-fg-default" : "text-fg-muted/40"} ${isSelected ? "bg-primary-500 text-white" : "hover:bg-primary-500/15 hover:text-primary-500"}`}>{date.getDate()}</button>; })}</div>
      <div className="flex justify-between mt-3 pt-2 border-t border-border-subtle/50"><button type="button" onClick={() => { onChange(""); setOpen(false); }} className="font-mono text-[9px] uppercase text-fg-muted hover:text-fg-default">Clear</button><button type="button" onClick={() => { onChange(toValue(new Date())); setOpen(false); }} className="font-mono text-[9px] uppercase text-primary-500 hover:text-primary-400">Today</button></div>
    </div>}
  </div>;
}
