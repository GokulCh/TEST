"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { applyThemePreset, THEME_PRESETS } from "@/lib/theme-presets";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("default");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("guild-theme") ?? "default";
    setSelected(stored);
    applyThemePreset(stored);
  }, []);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);

  const choose = (id: string) => { setSelected(id); applyThemePreset(id); setOpen(false); };

  return (
    <div ref={root} className="relative mt-2 border-t border-border-subtle/60 pt-3">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border border-border-subtle/60 bg-bg-canvas/20 px-3 text-[13px] font-medium text-fg-muted transition-colors hover:border-primary-500/40 hover:text-fg-default"
      >
        <span className="flex items-center gap-2.5"><Palette className="size-4 text-primary-500" /> Theme</span>
        <span className="max-w-24 truncate text-xs text-primary-500">{THEME_PRESETS[selected]?.name ?? "Default"}</span>
      </button>
      {open && (
        <div role="listbox" aria-label="Theme" className="motion-pop absolute bottom-full left-0 right-0 z-[1050] mb-2 max-h-72 origin-bottom overflow-y-auto rounded-xl border border-border-subtle bg-panel-bg p-1.5 shadow-2xl">
          {Object.values(THEME_PRESETS).map((preset) => (
            <button
              type="button"
              role="option"
              aria-selected={selected === preset.id}
              key={preset.id}
              onClick={() => choose(preset.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs font-medium text-fg-muted transition-colors hover:bg-bg-canvas/60 hover:text-fg-default"
            >
              <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: preset.primary }} />{preset.name}</span>
              {selected === preset.id && <Check className="size-3.5 text-primary-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
