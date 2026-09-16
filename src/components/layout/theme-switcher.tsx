"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { applyThemePreset, THEME_PRESETS } from "@/lib/theme-presets";

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("default");
  useEffect(() => {
    const stored = localStorage.getItem("guild-theme") ?? "default";
    setSelected(stored);
    applyThemePreset(stored);
  }, []);
  const choose = (id: string) => { setSelected(id); applyThemePreset(id); setOpen(false); };
  return <div className="relative border-t border-border-subtle/60 pt-3 mt-2">
    <button type="button" onClick={() => setOpen((value) => !value)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border-subtle/60 bg-bg-canvas/20 text-fg-muted hover:text-fg-default hover:border-primary-500/40 font-mono text-[11px] font-bold uppercase tracking-wider">
      <span className="flex items-center gap-2.5"><Palette className="size-4 text-primary-500" /> Theme</span><span className="text-[9px] text-primary-500 truncate max-w-24">{THEME_PRESETS[selected]?.name ?? "Default Matrix"}</span>
    </button>
    {open && <div className="absolute bottom-full left-0 right-0 mb-2 max-h-72 overflow-y-auto rounded-lg border border-border-subtle bg-panel-bg p-1.5 shadow-2xl z-popover">
      {Object.values(THEME_PRESETS).map((preset) => <button type="button" key={preset.id} onClick={() => choose(preset.id)} className="w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left font-mono text-[10px] uppercase tracking-wide text-fg-muted hover:bg-bg-canvas/60 hover:text-fg-default"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: preset.primary }} />{preset.name}</span>{selected === preset.id && <Check className="size-3.5 text-primary-500" />}</button>)}
    </div>}
  </div>;
}
