export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  panelBg: string;
  canvasBg: string;
  fgDefault: string;
  fgMuted: string;
  border: string;
  raised: string;
  inset: string;
  secondary: string;
  danger: string;
}

const palette = (id: string, name: string, primary: string, canvasBg: string, panelBg: string, raised: string, inset: string, border: string, secondary: string, danger: string): ThemePreset => ({ id, name, primary, canvasBg, panelBg, raised, inset, border, secondary, danger, fgDefault: "#f5f1e8", fgMuted: "#aaa49a" });

export const THEME_PRESETS: Record<string, ThemePreset> = {
  default: palette("default", "Default Matrix", "#39d98a", "#171513", "#211f1c", "#292622", "#0d0c0b", "#454039", "#c8a66a", "#ff5c6c"),
  indigo: palette("indigo", "Core Indigo", "#8fa8ff", "#0c1020", "#151c34", "#202a4a", "#080b16", "#3c4b77", "#c0a8ff", "#ff7484"),
  emerald: palette("emerald", "Obsidian Emerald", "#4be6a5", "#071713", "#0e2920", "#164333", "#04100d", "#2e5f4c", "#f0c674", "#ff7180"),
  rose: palette("rose", "Crimson Velvet", "#ff8395", "#1b0b12", "#351522", "#492030", "#10050a", "#713545", "#f6c177", "#ff5c6c"),
  amber: palette("amber", "Cyber Amber", "#ffc857", "#1a1207", "#34240f", "#493316", "#0f0903", "#795622", "#8de0ca", "#ff7180"),
  violet: palette("violet", "Midnight Neon", "#c29bff", "#110b20", "#24163e", "#332052", "#090510", "#5b3c85", "#74e5ff", "#ff7990"),
  cyan: palette("cyan", "Glacial Matrix", "#62e7f4", "#07171d", "#103541", "#174957", "#041015", "#316c7b", "#b6a0ff", "#ff7180"),
  fuchsia: palette("fuchsia", "Synthwave Dusk", "#f48dff", "#1b091e", "#391542", "#50205c", "#100511", "#71377b", "#77ddff", "#ff7180"),
  sky: palette("sky", "Atmosphere Node", "#6ed6ff", "#071923", "#113247", "#1a455f", "#041016", "#32627e", "#c0a4ff", "#ff7180"),
  teal: palette("teal", "Deep Abyssal", "#5de1d0", "#061816", "#0f302c", "#174a43", "#03100e", "#2d665d", "#d7bc73", "#ff7180"),
  lime: palette("lime", "Radioactive FSM", "#c5f36b", "#121707", "#273313", "#37471b", "#080c03", "#596f2a", "#8de0ca", "#ff7180"),
  orange: palette("orange", "Magma Cluster", "#ffae62", "#1b0b05", "#3a1b0c", "#50250f", "#100501", "#743c1b", "#ffe08a", "#ff7180"),
  zinc: palette("zinc", "Monochrome Pro", "#f0f0f2", "#111214", "#202226", "#2b2e34", "#090a0b", "#484c55", "#b8c2d9", "#ff7180"),
  slate: palette("slate", "Stealth Slate", "#a9c7ff", "#0d1520", "#1a2a3d", "#243b55", "#080e16", "#405a78", "#d3a8ff", "#ff7180"),
  blue: palette("blue", "Sapphire Core", "#72a7ff", "#071126", "#122754", "#1b3974", "#030817", "#38599a", "#c8a4ff", "#ff7180"),
  purple: palette("purple", "Eldritch Warp", "#d09cff", "#12081d", "#2b1248", "#3c1d61", "#090410", "#63368b", "#79e5ff", "#ff7180"),
  pink: palette("pink", "Cyberpunk Sakura", "#ff91c9", "#1d0915", "#3d152e", "#54203f", "#10040b", "#763e64", "#9ce5ff", "#ff7180"),
  red: palette("red", "Alert Matrix", "#ff8585", "#1b0909", "#3c1515", "#522020", "#100404", "#773737", "#ffd36f", "#ff5c6c"),
  neutral: palette("neutral", "Asphalt Industrial", "#e0e0e0", "#171717", "#292929", "#373737", "#0d0d0d", "#505050", "#b8c6d9", "#ff7c86"),
  stone: palette("stone", "Warm Quarks", "#e6d2b4", "#1c1917", "#302a26", "#403832", "#100e0c", "#5f5349", "#b6d7c5", "#ff7c86"),
  gold: palette("gold", "Imperial Relic", "#f4cb65", "#171207", "#34270d", "#493712", "#0d0902", "#72571f", "#9fe0cc", "#ff7c86"),
};

export const applyThemePreset = (presetId: string) => {
  const preset = THEME_PRESETS[presetId] ?? THEME_PRESETS.default;
  const root = document.documentElement;
  root.style.setProperty("--primary-50", `${preset.primary}26`);
  root.style.setProperty("--primary-500", preset.primary);
  root.style.setProperty("--primary-600", preset.primary);
  root.style.setProperty("--panel-bg", preset.panelBg);
  root.style.setProperty("--bg-canvas", preset.canvasBg);
  root.style.setProperty("--fg-default", preset.fgDefault);
  root.style.setProperty("--fg-muted", preset.fgMuted);
  root.style.setProperty("--border-subtle", preset.border);
  root.style.setProperty("--surface-raised", preset.raised);
  root.style.setProperty("--surface-inset", preset.inset);
  root.style.setProperty("--secondary-50", `${preset.secondary}26`);
  root.style.setProperty("--secondary-500", preset.secondary);
  root.style.setProperty("--secondary-600", preset.secondary);
  root.style.setProperty("--tertiary-500", preset.danger);
  root.style.setProperty("--tertiary-600", preset.danger);
  root.style.setProperty("--accent-purple", preset.secondary);
  root.style.setProperty("--accent-cyan", preset.primary);
  root.style.setProperty("--focus-ring", preset.primary);
  root.dataset.theme = preset.id;
  localStorage.setItem("guild-theme", preset.id);
};
