"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { DropdownOption } from "./OptionDropdown";

interface MultiOptionDropdownProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: DropdownOption[];
  placeholder?: string;
  emptyLabel?: string;
  ariaLabel?: string;
}

export default function MultiOptionDropdown({ values, onChange, options, placeholder = "Select options", emptyLabel = "No options found", ariaLabel }: MultiOptionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchId = useId();
  const selected = options.filter((option) => values.includes(option.value));
  const filtered = options.filter((option) => (option.searchLabel ?? option.label).toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isOpen]);

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={isOpen} aria-label={ariaLabel} onClick={() => setIsOpen((open) => !open)} className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 text-left font-mono text-sm text-fg-default focus:border-primary-500/60 focus:outline-none focus:ring-1 focus:ring-primary-500/30">
        <span className={`min-w-0 truncate ${selected.length ? "" : "text-fg-muted"}`}>{selected.length ? selected.map((item) => item.label).join(", ") : placeholder}</span>
        <ChevronDown className={`size-3.5 shrink-0 text-fg-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="absolute inset-x-0 top-full z-[200] mt-1 overflow-hidden rounded-lg border border-border-subtle bg-panel-bg shadow-xl shadow-black/30">
        <div className="border-b border-border-subtle/60 p-2"><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted" /><input id={searchId} autoFocus value={query} placeholder="Search..." aria-label="Search options" onChange={(event) => setQuery(event.target.value)} className="h-9 w-full rounded-md border border-border-subtle bg-bg-canvas/40 pl-8 pr-2 font-mono text-sm text-fg-default outline-none placeholder:text-fg-muted focus:border-primary-500/60" /></div></div>
        <div role="listbox" aria-multiselectable="true" aria-label={ariaLabel ?? placeholder} className="max-h-56 overflow-y-auto p-1">{filtered.length ? filtered.map((option) => <button type="button" role="option" aria-selected={values.includes(option.value)} key={option.value} onClick={() => toggle(option.value)} className={`flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-left font-mono text-sm text-fg-default hover:bg-bg-canvas/70 ${values.includes(option.value) ? "bg-primary-500/10 text-primary-400" : ""}`}>{option.icon}<span className="min-w-0 flex-1 truncate">{option.label}</span>{values.includes(option.value) && <Check className="size-3.5 shrink-0" />}</button>) : <div className="px-3 py-4 text-center font-mono text-[10px] text-fg-muted">{emptyLabel}</div>}</div>
      </div>}
    </div>
  );
}
