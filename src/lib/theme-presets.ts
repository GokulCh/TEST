export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  panelBg: string;
  canvasBg: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  default: { id: "default", name: "Default Matrix", primary: "#38bdf8", panelBg: "#111827", canvasBg: "#080b12" },
  indigo: { id: "indigo", name: "Core Indigo", primary: "#4f46e5", panelBg: "#1e1b4b", canvasBg: "#090514" },
  emerald: { id: "emerald", name: "Obsidian Emerald", primary: "#10b981", panelBg: "#064e3b", canvasBg: "#020617" },
  rose: { id: "rose", name: "Crimson Velvet", primary: "#f43f5e", panelBg: "#4c0519", canvasBg: "#0f0507" },
  amber: { id: "amber", name: "Cyber Amber", primary: "#f59e0b", panelBg: "#451a03", canvasBg: "#0c0a09" },
  violet: { id: "violet", name: "Midnight Neon", primary: "#8b5cf6", panelBg: "#2e1065", canvasBg: "#0b041a" },
  cyan: { id: "cyan", name: "Glacial Matrix", primary: "#06b6d4", panelBg: "#164e63", canvasBg: "#04151f" },
  fuchsia: { id: "fuchsia", name: "Synthwave Dusk", primary: "#d946ef", panelBg: "#4a044e", canvasBg: "#120214" },
  sky: { id: "sky", name: "Atmosphere Node", primary: "#0ea5e9", panelBg: "#0c4a6e", canvasBg: "#03111a" },
  teal: { id: "teal", name: "Deep Abyssal", primary: "#14b8a6", panelBg: "#134e4a", canvasBg: "#021210" },
  lime: { id: "lime", name: "Radioactive FSM", primary: "#84cc16", panelBg: "#271c06", canvasBg: "#0a0d03" },
  orange: { id: "orange", name: "Magma Cluster", primary: "#f97316", panelBg: "#431407", canvasBg: "#140702" },
  zinc: { id: "zinc", name: "Monochrome Pro", primary: "#71717a", panelBg: "#18181b", canvasBg: "#09090b" },
  slate: { id: "slate", name: "Stealth Slate", primary: "#64748b", panelBg: "#1e293b", canvasBg: "#0f172a" },
  blue: { id: "blue", name: "Sapphire Core", primary: "#3b82f6", panelBg: "#1e3a8a", canvasBg: "#050b1e" },
  purple: { id: "purple", name: "Eldritch Warp", primary: "#a855f7", panelBg: "#3b0764", canvasBg: "#0d0217" },
  pink: { id: "pink", name: "Cyberpunk Sakura", primary: "#ec4899", panelBg: "#500724", canvasBg: "#14020a" },
  red: { id: "red", name: "Alert Matrix", primary: "#ef4444", panelBg: "#450a0a", canvasBg: "#140303" },
  neutral: { id: "neutral", name: "Asphalt Industrial", primary: "#737373", panelBg: "#262626", canvasBg: "#171717" },
  stone: { id: "stone", name: "Warm Quarks", primary: "#78716c", panelBg: "#292524", canvasBg: "#1c1917" },
  gold: { id: "gold", name: "Imperial Relic", primary: "#d4af37", panelBg: "#3a2f0f", canvasBg: "#120f05" },
};

export const applyThemePreset = (presetId: string) => {
  const preset = THEME_PRESETS[presetId] ?? THEME_PRESETS.default;
  const root = document.documentElement;
  root.style.setProperty("--primary-50", `${preset.primary}26`);
  root.style.setProperty("--primary-500", preset.primary);
  root.style.setProperty("--primary-600", preset.primary);
  root.style.setProperty("--panel-bg", preset.panelBg);
  root.style.setProperty("--bg-canvas", preset.canvasBg);
  root.dataset.theme = preset.id;
  localStorage.setItem("guild-theme", preset.id);
};
