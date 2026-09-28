"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { DropdownOption } from "./OptionDropdown";

interface MultiOptionDropdownProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: DropdownOption[];
  placeholder?: string;
  emptyLabel?: string;
  ariaLabel?: string;
  className?: string;
}

export default function MultiOptionDropdown({ values, onChange, options, placeholder = "Select options", emptyLabel = "No options found", ariaLabel, className = "" }: MultiOptionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, bottom: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchId = useId();
  const selected = options.filter((option) => values.includes(option.value));
  const filtered = options.filter((option) => (option.searchLabel ?? option.label).toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!isOpen) return;
    const updatePlacement = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) {
        setOpenUpward(rect.bottom + 330 > window.innerHeight && rect.top > 330);
        setMenuPosition({ left: rect.left, top: rect.bottom + 4, bottom: window.innerHeight - rect.top + 4, width: rect.width });
      }
    };
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [isOpen]);

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button type="button" aria-haspopup="listbox" aria-expanded={isOpen} aria-label={ariaLabel} onClick={() => setIsOpen((open) => !open)} className="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-canvas/40 px-3 text-left text-sm text-fg-default transition-[border-color,box-shadow,background-color] duration-150 hover:border-fg-muted/30 focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/15 aria-expanded:border-primary-500/60">
        <span className={`min-w-0 truncate ${selected.length ? "" : "text-fg-muted"}`}>{selected.length ? selected.map((item) => item.label).join(", ") : placeholder}</span>
        <ChevronDown className={`size-3.5 shrink-0 text-fg-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} style={{ position: "fixed", left: menuPosition.left, width: menuPosition.width, ...(openUpward ? { bottom: menuPosition.bottom } : { top: menuPosition.top }) }} className={`motion-pop z-[1000] overflow-hidden rounded-xl border border-border-subtle bg-panel-bg shadow-xl shadow-black/30 ${openUpward ? "origin-bottom" : "origin-top"}`}>
          <div className="border-b border-border-subtle/60 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-muted" />
              <input
                id={searchId}
                autoFocus
                value={query}
                placeholder="Search..."
                aria-label="Search options"
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 w-full rounded-md border border-border-subtle bg-bg-canvas/40 pl-8 pr-2 text-sm text-fg-default outline-none placeholder:text-fg-muted focus:border-primary-500/60"
              />
            </div>
          </div>
          <div role="listbox" aria-multiselectable="true" aria-label={ariaLabel ?? placeholder} className="max-h-56 overflow-y-auto p-1">
            {filtered.length ? filtered.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={values.includes(option.value)}
                key={option.value}
                onClick={() => toggle(option.value)}
                className={`flex min-h-10 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-fg-default transition-[background-color,color] duration-150 hover:bg-bg-canvas/70 ${values.includes(option.value) ? "bg-primary-500/10 text-primary-400" : ""}`}
              >
                {option.icon}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {values.includes(option.value) && <Check className="size-3.5 shrink-0" />}
              </button>
            )) : <div className="px-3 py-4 text-center text-xs text-fg-muted">{emptyLabel}</div>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
